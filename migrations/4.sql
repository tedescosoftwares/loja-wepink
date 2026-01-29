
ALTER TABLE orders ADD COLUMN customer_address TEXT;
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'whatsapp';
