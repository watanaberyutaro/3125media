-- Add INSERT policy for ai_usage table
-- This allows authenticated users to insert their own usage records

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own ai_usage" ON ai_usage;

-- Allow authenticated users to insert their own usage records
CREATE POLICY "Users can insert own ai_usage"
  ON ai_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
