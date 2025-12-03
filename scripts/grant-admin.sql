-- Grant admin access to the user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zplbeuyedydodnrgkazl/sql

UPDATE users
SET role = 'admin'
WHERE email = 'r.watanabe@3125.jp';

-- Verify the update
SELECT id, email, name, role, created_at
FROM users
WHERE email = 'r.watanabe@3125.jp';
