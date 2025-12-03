-- Run this SQL in your Supabase SQL Editor to set up storage for avatar uploads
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Create a public storage bucket for user avatars and other public files
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the public bucket

-- Allow anyone to read files from the public bucket
CREATE POLICY IF NOT EXISTS "Public bucket is readable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Allow authenticated users to upload files to their own folder
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to public bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public');

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public');
