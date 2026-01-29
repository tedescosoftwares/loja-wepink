
CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value REAL NOT NULL,
  minimum_order_amount REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO coupons (code, discount_type, discount_value, minimum_order_amount, is_active, usage_limit, valid_until)
VALUES ('ambev10%', 'percentage', 10.0, 200.0, 1, NULL, '2025-12-31 23:59:59');
