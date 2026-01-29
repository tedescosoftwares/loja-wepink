
-- Atualizar produtos existentes para as novas categorias específicas
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Coca-Cola' LIMIT 1) WHERE name LIKE '%Coca-Cola%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Antarctica' LIMIT 1) WHERE name LIKE '%Antarctica%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Crystal' LIMIT 1) WHERE name LIKE '%Crystal%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Del Valle' LIMIT 1) WHERE name LIKE '%Del Valle%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Skol' LIMIT 1) WHERE name LIKE '%Skol%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Red Bull' LIMIT 1) WHERE name LIKE '%Red Bull%';

-- Adicionar mais produtos organizados por marca
INSERT INTO products (name, description, price, original_price, image_url, category_id, is_featured, stock_quantity) VALUES 

-- Produtos Coca-Cola
('Coca-Cola 2L', 'Refrigerante Coca-Cola garrafa 2 litros', 9.90, 10.90, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', (SELECT id FROM categories WHERE name = 'Coca-Cola' LIMIT 1), 0, 80),
('Coca-Cola Zero 350ml', 'Refrigerante Coca-Cola Zero lata 350ml', 3.50, null, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', (SELECT id FROM categories WHERE name = 'Coca-Cola' LIMIT 1), 0, 120),
('Fanta Laranja 350ml', 'Refrigerante Fanta Laranja lata 350ml', 3.20, null, 'https://images.unsplash.com/photo-1625825349060-5d5e3ea7f3c6?w=400', (SELECT id FROM categories WHERE name = 'Coca-Cola' LIMIT 1), 0, 90),

-- Produtos Antarctica
('Antarctica Original 350ml', 'Cerveja Antarctica Original lata 350ml', 3.50, null, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', (SELECT id FROM categories WHERE name = 'Antarctica' LIMIT 1), 0, 150),
('Antarctica Pilsen 600ml', 'Cerveja Antarctica Pilsen garrafa 600ml', 5.90, null, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', (SELECT id FROM categories WHERE name = 'Antarctica' LIMIT 1), 1, 100),

-- Produtos Pepsi
('Pepsi 350ml', 'Refrigerante Pepsi lata 350ml', 3.30, null, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', (SELECT id FROM categories WHERE name = 'Pepsi' LIMIT 1), 0, 85),
('Pepsi 2L', 'Refrigerante Pepsi garrafa 2 litros', 8.90, null, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', (SELECT id FROM categories WHERE name = 'Pepsi' LIMIT 1), 0, 60),

-- Produtos Skol
('Skol 350ml Pack 12un', 'Pack com 12 latas de Skol 350ml', 35.90, 39.90, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', (SELECT id FROM categories WHERE name = 'Skol' LIMIT 1), 1, 40),
('Skol Beats Senses 313ml', 'Bebida Ice Skol Beats Senses 313ml', 4.50, null, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', (SELECT id FROM categories WHERE name = 'Skol' LIMIT 1), 0, 70),

-- Produtos Brahma
('Brahma 350ml', 'Cerveja Brahma lata 350ml', 3.20, null, 'https://images.unsplash.com/photo-1594736797933-d0acc29bf7fa?w=400', (SELECT id FROM categories WHERE name = 'Brahma' LIMIT 1), 0, 140),
('Brahma 600ml', 'Cerveja Brahma garrafa 600ml', 5.50, null, 'https://images.unsplash.com/photo-1594736797933-d0acc29bf7fa?w=400', (SELECT id FROM categories WHERE name = 'Brahma' LIMIT 1), 0, 90),

-- Produtos Heineken
('Heineken 330ml', 'Cerveja Heineken garrafa 330ml', 6.90, null, 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef4?w=400', (SELECT id FROM categories WHERE name = 'Heineken' LIMIT 1), 1, 80),
('Heineken 0.0% 330ml', 'Cerveja Heineken sem álcool 330ml', 7.50, null, 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef4?w=400', (SELECT id FROM categories WHERE name = 'Heineken' LIMIT 1), 0, 50),

-- Produtos Crystal
('Água Crystal com Gás 500ml', 'Água mineral Crystal com gás 500ml', 2.50, null, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', (SELECT id FROM categories WHERE name = 'Crystal' LIMIT 1), 0, 180),
('Água Crystal 1.5L', 'Água mineral Crystal garrafa 1.5 litros', 3.50, null, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', (SELECT id FROM categories WHERE name = 'Crystal' LIMIT 1), 0, 120),

-- Produtos Del Valle
('Suco Del Valle Uva 1L', 'Suco de uva Del Valle 1 litro', 7.50, null, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', (SELECT id FROM categories WHERE name = 'Del Valle' LIMIT 1), 0, 55),
('Suco Del Valle Maçã 1L', 'Suco de maçã Del Valle 1 litro', 7.20, null, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', (SELECT id FROM categories WHERE name = 'Del Valle' LIMIT 1), 0, 45),

-- Produtos Red Bull
('Red Bull Sugar Free 250ml', 'Energético Red Bull sem açúcar 250ml', 13.50, null, 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400', (SELECT id FROM categories WHERE name = 'Red Bull' LIMIT 1), 0, 65),
('Red Bull Tropical 250ml', 'Energético Red Bull sabor tropical 250ml', 14.90, null, 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400', (SELECT id FROM categories WHERE name = 'Red Bull' LIMIT 1), 1, 40);
