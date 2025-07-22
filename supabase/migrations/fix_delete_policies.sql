-- Check and Fix RLS Policies for Delete Operations
-- Path: supabase/migrations/fix_delete_policies.sql

-- First, check current RLS status
SELECT 
  schemaname || '.' || tablename as table_name,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('parent_child_relationships', 'class_assignments', 'curriculum_assignments')
ORDER BY tablename;

-- Check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('parent_child_relationships', 'class_assignments', 'curriculum_assignments')
ORDER BY tablename, policyname;

-- Enable RLS if not already enabled
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policies (if any)
DROP POLICY IF EXISTS "delete_parent_child_relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "delete_class_assignments" ON class_assignments;
DROP POLICY IF EXISTS "delete_curriculum_assignments" ON curriculum_assignments;

-- Create permissive delete policies for authenticated users
-- For now, we'll allow authenticated users to delete records they have access to

-- Parent-Child Relationships: Allow deletion for authenticated users
CREATE POLICY "delete_parent_child_relationships" 
ON parent_child_relationships 
FOR DELETE 
TO authenticated 
USING (true);  -- For testing, allow all authenticated users to delete

-- Class Assignments: Allow deletion for authenticated users
CREATE POLICY "delete_class_assignments" 
ON class_assignments 
FOR DELETE 
TO authenticated 
USING (true);  -- For testing, allow all authenticated users to delete

-- Curriculum Assignments: Allow deletion for authenticated users
CREATE POLICY "delete_curriculum_assignments" 
ON curriculum_assignments 
FOR DELETE 
TO authenticated 
USING (true);  -- For testing, allow all authenticated users to delete

-- Also ensure we have proper SELECT, INSERT, and UPDATE policies
-- Parent-Child Relationships
CREATE POLICY IF NOT EXISTS "select_parent_child_relationships" 
ON parent_child_relationships 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "insert_parent_child_relationships" 
ON parent_child_relationships 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "update_parent_child_relationships" 
ON parent_child_relationships 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Class Assignments
CREATE POLICY IF NOT EXISTS "select_class_assignments" 
ON class_assignments 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "insert_class_assignments" 
ON class_assignments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "update_class_assignments" 
ON class_assignments 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Curriculum Assignments
CREATE POLICY IF NOT EXISTS "select_curriculum_assignments" 
ON curriculum_assignments 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "insert_curriculum_assignments" 
ON curriculum_assignments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "update_curriculum_assignments" 
ON curriculum_assignments 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Verify policies are created
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('parent_child_relationships', 'class_assignments', 'curriculum_assignments')
ORDER BY tablename, cmd;