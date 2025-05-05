-- Enable RLS on schools table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can do everything with schools" ON schools;
DROP POLICY IF EXISTS "Allow authenticated users to create schools" ON schools;
DROP POLICY IF EXISTS "School admins can read their own school" ON schools;
DROP POLICY IF EXISTS "School admins can update their own school" ON schools;
DROP POLICY IF EXISTS "Teachers can read their school" ON schools;
DROP POLICY IF EXISTS "Students can read their school" ON schools;

-- Create policies for schools table

-- Allow admins to do everything
CREATE POLICY "Admins can do everything with schools"
ON schools
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND (role = 'admin' OR role = 'school_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND (role = 'admin' OR role = 'school_admin')
  )
);

-- Allow authenticated users to create schools (needed for initial setup)
CREATE POLICY "Allow authenticated users to create schools"
ON schools
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow school admins to read their own school
CREATE POLICY "School admins can read their own school"
ON schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND (role = 'school_admin' OR role = 'admin')
    AND school_id::bigint = schools.id
  )
);

-- Allow school admins to update their own school
CREATE POLICY "School admins can update their own school"
ON schools
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND (role = 'school_admin' OR role = 'admin')
    AND school_id::bigint = schools.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND (role = 'school_admin' OR role = 'admin')
    AND school_id::bigint = schools.id
  )
);

-- Allow teachers to read their school
CREATE POLICY "Teachers can read their school"
ON schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND (role = 'teacher' OR role = 'admin')
    AND school_id::bigint = schools.id
  )
);

-- Allow students to read their school
CREATE POLICY "Students can read their school"
ON schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND (role = 'student' OR role = 'admin')
    AND school_id::bigint = schools.id
  )
); 