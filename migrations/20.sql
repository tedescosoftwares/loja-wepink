
-- Add columns to uploaded_images table for local storage
ALTER TABLE uploaded_images ADD COLUMN public_url TEXT;
ALTER TABLE uploaded_images ADD COLUMN base64_data TEXT;
