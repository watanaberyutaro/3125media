-- Add policies to allow admins to delete likes and impressions
-- This is necessary for article deletion to work properly

-- Allow admins to delete any likes
CREATE POLICY "Admins can delete any likes" ON likes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to delete any impressions
CREATE POLICY "Admins can delete impressions" ON impressions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to delete any article_tags
-- (This might already be covered by "Admins can manage article tags" but let's be explicit)
CREATE POLICY "Admins can delete article tags" ON article_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
