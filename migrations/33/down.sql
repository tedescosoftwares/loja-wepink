
-- Revert to default/empty settings
UPDATE site_settings SET setting_value = '' WHERE setting_key IN (
  'pagleve_api_key', 
  'pagleve_secret', 
  'pagleve_base_url', 
  'pagleve_sandbox_url'
);
UPDATE site_settings SET setting_value = '0' WHERE setting_key = 'automatic_payments_enabled';
UPDATE site_settings SET setting_value = '1' WHERE setting_key = 'manual_operator_mode';
