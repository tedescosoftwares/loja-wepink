
-- Update site settings with correct PagLeve configuration
INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at) VALUES 
('pagleve_api_key', '01K0VY2M7VTVDM8Y8401NSTPGT', datetime('now')),
('pagleve_secret', 'qonSr0Q9cLD1QkVkJ6QqZeFrY2jaeL02A2BTQJs2', datetime('now')),
('pagleve_base_url', 'https://api.pagaleve.com.br', datetime('now')),
('pagleve_sandbox_url', 'https://sandbox-api.pagaleve.io', datetime('now')),
('automatic_payments_enabled', '1', datetime('now')),
('manual_operator_mode', '0', datetime('now'));
