-- First, sign up the user through the application UI at http://localhost:3001/register
-- Email: r.watanabe@3125.jp
-- Password: Pw31253125
-- Name: 渡辺

-- Then, run this SQL in Supabase SQL Editor to make the user an admin:
UPDATE users
SET role = 'admin'
WHERE email = 'r.watanabe@3125.jp';
