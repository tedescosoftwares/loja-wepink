
-- Add state detection fields to customer_locations table
ALTER TABLE customer_locations ADD COLUMN detected_state TEXT;
ALTER TABLE customer_locations ADD COLUMN detected_city TEXT;
ALTER TABLE customer_locations ADD COLUMN detected_country TEXT;

-- Add state field to distribution_centers
ALTER TABLE distribution_centers ADD COLUMN state_code TEXT;
ALTER TABLE distribution_centers ADD COLUMN city TEXT;
ALTER TABLE distribution_centers ADD COLUMN region TEXT;
