-- Migration: Add role column to class_assignments table
-- Path: supabase/migrations/add_role_to_class_assignments.sql

-- Add the role column to class_assignments
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'primary';

-- Add check constraint for valid roles
ALTER TABLE class_assignments
DROP CONSTRAINT IF EXISTS class_assignments_role_check;

ALTER TABLE class_assignments 
ADD CONSTRAINT class_assignments_role_check 
CHECK (role IN ('primary', 'assistant', 'substitute'));

-- Update existing records to have a role
UPDATE class_assignments 
SET role = CASE 
  WHEN is_primary = true THEN 'primary'
  ELSE 'assistant'
END
WHERE role IS NULL;

-- Add start_date and end_date columns if they don't exist
ALTER TABLE class_assignments
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE class_assignments
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE class_assignments
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN class_assignments.role IS 'Teacher role in the class: primary, assistant, or substitute';
COMMENT ON COLUMN class_assignments.start_date IS 'Date when the teacher assignment starts';
COMMENT ON COLUMN class_assignments.end_date IS 'Date when the teacher assignment ends (null for ongoing)';
COMMENT ON COLUMN class_assignments.notes IS 'Additional notes about the assignment';