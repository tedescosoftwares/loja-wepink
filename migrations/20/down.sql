
-- Remove columns from uploaded_images table
ALTER TABLE uploaded_images DROP COLUMN public_url;
ALTER TABLE uploaded_images DROP COLUMN base64_data;
