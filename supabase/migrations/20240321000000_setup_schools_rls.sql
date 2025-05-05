-- Enable RLS on schools table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Create policies for schools table

-- Allow admins to do everything
CREATE POLICY "Admins can do everything with schools"
ON schools
FOR ALL
TO authenticated
USING (
  auth.role() = 'admin'
)
WITH CHECK (
  auth.role() = 'admin'
);

-- Allow school admins to read their own school
CREATE POLICY "School admins can read their own school"
ON schools
FOR SELECT
TO authenticated
USING (
  auth.role() = 'school_admin' AND
  id::text = (
    SELECT school_id::text 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Allow school admins to update their own school
CREATE POLICY "School admins can update their own school"
ON schools
FOR UPDATE
TO authenticated
USING (
  auth.role() = 'school_admin' AND
  id::text = (
    SELECT school_id::text 
    FROM users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  auth.role() = 'school_admin' AND
  id::text = (
    SELECT school_id::text 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Allow teachers to read their school
CREATE POLICY "Teachers can read their school"
ON schools
FOR SELECT
TO authenticated
USING (
  auth.role() = 'teacher' AND
  id::text = (
    SELECT school_id::text 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Allow students to read their school
CREATE POLICY "Students can read their school"
ON schools
FOR SELECT
TO authenticated
USING (
  auth.role() = 'student' AND
  id::text = (
    SELECT school_id::text 
    FROM users 
    WHERE id = auth.uid()
  )
); 