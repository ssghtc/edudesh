-- =====================================================================
-- FIX DATA LOADING ISSUES
-- Run this in Supabase SQL Editor to diagnose and fix loading problems
-- =====================================================================

-- STEP 1: DIAGNOSE - Check what's in the tables
SELECT 'questions count' as check_name, COUNT(*)::text as result FROM questions
UNION ALL
SELECT 'subjects count', COUNT(*)::text FROM subjects
UNION ALL
SELECT 'chapters count', COUNT(*)::text FROM chapters;

-- STEP 2: FIX - Remove/update the type CHECK constraint
-- The original constraint only allows 7 types, but clinical types also need to be stored
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- Add updated constraint that allows all question types
ALTER TABLE questions 
ADD CONSTRAINT questions_type_check CHECK (
  type IN (
    'single', 'multiple', 'diagram', 'cloze', 'matrix', 'ordering', 'input',
    'sentence_completion', 'drag_drop_priority', 'compare_classify',
    'expected_not_expected', 'indicated_not_indicated', 'sata',
    'priority_action', 'case_study'
  )
);

-- STEP 3: FIX - Ensure RLS policies allow SELECT (read)
-- Drop any duplicate or conflicting policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON questions;
DROP POLICY IF EXISTS "Enable update access for all users" ON questions;
DROP POLICY IF EXISTS "Enable delete access for all users" ON questions;

-- Recreate clean policies
CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON questions FOR DELETE USING (true);

-- Apply same fixes to subjects
DROP POLICY IF EXISTS "Enable read access for all users" ON subjects;
DROP POLICY IF EXISTS "Enable insert access for all users" ON subjects;
DROP POLICY IF EXISTS "Enable update access for all users" ON subjects;
DROP POLICY IF EXISTS "Enable delete access for all users" ON subjects;

CREATE POLICY "Enable read access for all users" ON subjects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON subjects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON subjects FOR DELETE USING (true);

-- Apply same fixes to chapters
DROP POLICY IF EXISTS "Enable read access for all users" ON chapters;
DROP POLICY IF EXISTS "Enable insert access for all users" ON chapters;
DROP POLICY IF EXISTS "Enable update access for all users" ON chapters;
DROP POLICY IF EXISTS "Enable delete access for all users" ON chapters;

CREATE POLICY "Enable read access for all users" ON chapters FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON chapters FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON chapters FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON chapters FOR DELETE USING (true);

-- STEP 4: FIX - Also fix clinical_questions if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clinical_questions') THEN
    DROP POLICY IF EXISTS "Enable read access for all users" ON clinical_questions;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON clinical_questions;
    DROP POLICY IF EXISTS "Enable update access for all users" ON clinical_questions;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON clinical_questions;

    CREATE POLICY "Enable read access for all users" ON clinical_questions FOR SELECT USING (true);
    CREATE POLICY "Enable insert access for all users" ON clinical_questions FOR INSERT WITH CHECK (true);
    CREATE POLICY "Enable update access for all users" ON clinical_questions FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "Enable delete access for all users" ON clinical_questions FOR DELETE USING (true);

    RAISE NOTICE 'clinical_questions policies updated';
  ELSE
    RAISE NOTICE 'clinical_questions table does not exist - skipping';
  END IF;
END $$;

-- STEP 5: ADD MISSING COLUMNS (safe - won't affect existing data)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS client_needs TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS scenario TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS rationale TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS custom_id TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS exhibits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- STEP 6: VERIFY - Confirm policies are set correctly
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('questions', 'subjects', 'chapters', 'clinical_questions')
ORDER BY tablename, cmd;

-- STEP 7: VERIFY - Check row count again
SELECT 'questions' as table_name, COUNT(*) as row_count FROM questions
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'chapters', COUNT(*) FROM chapters;
