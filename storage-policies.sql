-- Fix Supabase Storage RLS policies for place-images bucket

-- First, check if RLS is enabled on storage.objects (it should be by default)
-- If not enabled, you can enable it with: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (in case there are conflicting ones)
DROP POLICY IF EXISTS "Give users access to place images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for place images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload place images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update place images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete place images" ON storage.objects;

-- Create comprehensive policies for place-images bucket

-- 1. Allow public read access to images
CREATE POLICY "Public read access for place images" ON storage.objects
FOR SELECT USING (bucket_id = 'place-images');

-- 2. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload place images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'place-images' 
  AND auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to update images
CREATE POLICY "Authenticated users can update place images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'place-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete place images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'place-images' 
  AND auth.role() = 'authenticated'
);

-- Alternative: If the above doesn't work, try this more permissive policy
-- CREATE POLICY "Full access to place images" ON storage.objects
-- FOR ALL USING (bucket_id = 'place-images'); 