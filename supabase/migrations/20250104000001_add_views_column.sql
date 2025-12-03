-- Add views column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- Create index for better performance when sorting by views
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(views DESC);

-- Update existing articles to have 0 views
UPDATE articles SET views = 0 WHERE views IS NULL;
