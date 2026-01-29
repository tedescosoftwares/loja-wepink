
CREATE TABLE distribution_centers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  phone TEXT,
  email TEXT,
  operating_hours TEXT,
  delivery_radius_km REAL DEFAULT 50,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  nearest_center_id INTEGER,
  distance_to_center_km REAL,
  accuracy REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample distribution centers
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, operating_hours, delivery_radius_km) VALUES
('Centro São Paulo - Vila Olímpia', 'Av. Brigadeiro Faria Lima, 1234 - Vila Olímpia, São Paulo - SP', -23.5905, -46.6862, '(11) 3456-7890', 'Segunda a Sexta: 8h às 18h, Sábado: 8h às 14h', 30),
('Centro São Paulo - Mooca', 'Rua da Mooca, 567 - Mooca, São Paulo - SP', -23.5505, -46.5998, '(11) 2345-6789', 'Segunda a Sexta: 8h às 18h, Sábado: 8h às 14h', 25),
('Centro ABC - Santo André', 'Av. Industrial, 890 - Santo André - SP', -23.6537, -46.5308, '(11) 4567-8901', 'Segunda a Sexta: 8h às 18h, Sábado: 8h às 12h', 40),
('Centro Guarulhos', 'Av. Presidente Juscelino, 321 - Guarulhos - SP', -23.4543, -46.5333, '(11) 2234-5678', 'Segunda a Sexta: 8h às 18h', 35),
('Centro Osasco', 'Av. dos Autonomistas, 1111 - Osasco - SP', -23.5329, -46.7918, '(11) 3789-0123', 'Segunda a Sexta: 8h às 18h, Sábado: 8h às 14h', 30);
