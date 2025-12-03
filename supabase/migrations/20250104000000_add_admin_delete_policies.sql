-- Add policies to allow admins to delete likes and impressions
-- This is necessary for article deletion to work properly

-- Drop existing delete policy for likes if it exists
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

-- Create new policy that allows both users to delete their own likes AND admins to delete any likes
CREATE POLICY "Users and admins can delete likes" ON likes
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Add admin delete policy for impressions
CREATE POLICY "Admins can delete impressions" ON impressions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
