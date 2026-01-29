
-- Remove state detection fields
ALTER TABLE customer_locations DROP COLUMN detected_state;
ALTER TABLE customer_locations DROP COLUMN detected_city;
ALTER TABLE customer_locations DROP COLUMN detected_country;

-- Remove state field from distribution_centers
ALTER TABLE distribution_centers DROP COLUMN state_code;
ALTER TABLE distribution_centers DROP COLUMN city;
ALTER TABLE distribution_centers DROP COLUMN region;
