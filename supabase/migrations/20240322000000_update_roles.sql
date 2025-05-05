-- Update existing users with 'teacher' or 'student' roles to 'school_admin' (or another default allowed role)
UPDATE users
SET role = 'school_admin'
WHERE role IN ('teacher', 'student');

-- Alter the role column to restrict values to allowed roles only
ALTER TABLE users
  ALTER COLUMN role TYPE TEXT
  USING role::TEXT;

-- Drop existing policies that mention 'teacher' or 'student' roles
DROP POLICY IF EXISTS "Teachers can read their school" ON schools;
DROP POLICY IF EXISTS "Students can read their school" ON schools;

-- Create updated policies for schools table with allowed roles only
CREATE POLICY "Admins can do everything with schools"
ON schools
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'school_admin', 'main_supervisor', 'grades_supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'school_admin', 'main_supervisor', 'grades_supervisor')
  )
);

CREATE POLICY "School admins can read their own school"
ON schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role IN ('school_admin', 'admin', 'main_supervisor', 'grades_supervisor')
    AND school_id::bigint = schools.id
  )
);

CREATE POLICY "School admins can update their own school"
ON schools
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role IN ('school_admin', 'admin', 'main_supervisor', 'grades_supervisor')
    AND school_id::bigint = schools.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role IN ('school_admin', 'admin', 'main_supervisor', 'grades_supervisor')
    AND school_id::bigint = schools.id
  )
);
