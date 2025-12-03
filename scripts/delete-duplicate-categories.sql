-- Delete duplicate categories with Japanese slugs
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Check if there are any child categories or articles
SELECT
  c.id,
  c.name,
  c.slug,
  COUNT(DISTINCT cc.id) as child_count,
  COUNT(DISTINCT a.id) as article_count
FROM categories c
LEFT JOIN categories cc ON cc.parent_id = c.id
LEFT JOIN articles a ON a.category_id = c.id
WHERE c.id IN (
  '7f9be45e-7407-499e-9dae-205aa3d4d7cd',
  '8122355b-821c-4c8d-bb24-beb81ef69342'
)
GROUP BY c.id, c.name, c.slug;

-- Step 2: Delete the duplicate categories (if safe)
DELETE FROM categories
WHERE id IN (
  '7f9be45e-7407-499e-9dae-205aa3d4d7cd',
  '8122355b-821c-4c8d-bb24-beb81ef69342'
);

-- Step 3: Verify the deletion
SELECT id, name, slug, parent_id, "order"
FROM categories
WHERE parent_id IS NULL
ORDER BY "order";
