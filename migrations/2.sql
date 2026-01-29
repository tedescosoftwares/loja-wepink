
-- Clear existing data
DELETE FROM products;
DELETE FROM categories;
DELETE FROM banners;

-- Insert beverage categories
INSERT INTO categories (name, description, image_url) VALUES 
('Refrigerantes', 'Coca-Cola, Pepsi, Guaraná e outras bebidas gaseificadas', 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400'),
('Águas', 'Água mineral, com gás e saborizada', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400'),
('Sucos', 'Sucos naturais e industrializados', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400'),
('Cervejas', 'Cervejas nacionais e importadas', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
('Energéticos', 'Bebidas energéticas e isotônicos', 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400'),
('Vinhos', 'Vinhos tintos, brancos e rosés', 'https://images.unsplash.com/photo-1506377247744-2628f63cd89c?w=400');

-- Insert beverage products
INSERT INTO products (name, description, price, original_price, image_url, category_id, is_featured, stock_quantity) VALUES 
-- Refrigerantes
('Coca-Cola 350ml', 'Refrigerante tradicional lata 350ml', 3.50, 4.00, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', 1, 1, 100),
('Guaraná Antarctica 2L', 'Guaraná Antarctica garrafa 2 litros', 8.90, 9.90, 'https://images.unsplash.com/photo-1624552184280-8816bbeb5293?w=400', 1, 1, 50),
('Pepsi 600ml', 'Pepsi garrafa 600ml', 4.50, null, 'https://images.unsplash.com/photo-1594971475674-6a97f8d95583?w=400', 1, 0, 75),
('Sprite 350ml', 'Sprite lata 350ml', 3.50, null, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400', 1, 0, 80),

-- Águas
('Água Crystal 500ml', 'Água mineral Crystal 500ml', 2.00, null, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', 2, 1, 200),
('Água com Gás São Lourenço 510ml', 'Água com gás São Lourenço', 3.50, null, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400', 2, 0, 150),
('Água Saborizada Limão 500ml', 'Água saborizada sabor limão', 4.00, 4.50, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400', 2, 0, 100),

-- Sucos
('Suco Del Valle Laranja 1L', 'Suco de laranja Del Valle 1 litro', 6.90, null, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', 3, 1, 60),
('Suco Maguary Uva 1L', 'Suco de uva Maguary 1 litro', 7.50, 8.00, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400', 3, 0, 45),
('Suco Natural One Maçã 300ml', 'Suco natural de maçã 300ml', 5.90, null, 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400', 3, 0, 40),

-- Cervejas
('Skol Lata 350ml', 'Cerveja Skol lata 350ml', 3.20, null, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 4, 1, 120),
('Brahma 600ml', 'Cerveja Brahma garrafa 600ml', 5.50, null, 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400', 4, 0, 90),
('Heineken 330ml', 'Cerveja Heineken garrafa 330ml', 8.90, 9.90, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', 4, 0, 60),

-- Energéticos
('Red Bull 250ml', 'Energético Red Bull lata 250ml', 12.90, null, 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400', 5, 1, 80),
('Monster Energy 473ml', 'Monster Energy lata 473ml', 9.90, 10.90, 'https://images.unsplash.com/photo-1572888195658-0c13a778bfc1?w=400', 5, 0, 50),
('Gatorade 500ml', 'Isotônico Gatorade 500ml', 6.50, null, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', 5, 0, 70),

-- Vinhos
('Vinho Casillero Del Diablo', 'Vinho tinto chileno 750ml', 45.90, 49.90, 'https://images.unsplash.com/photo-1506377247744-2628f63cd89c?w=400', 6, 0, 25),
('Vinho Branco Riesling', 'Vinho branco alemão 750ml', 38.90, null, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', 6, 0, 20);

-- Insert beverage banners
INSERT INTO banners (title, subtitle, image_url, link_url, display_order) VALUES 
('Promoção de Verão!', 'Cervejas e refrigerantes gelados com até 30% OFF', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=1200', '/products', 1),
('Entrega Express', 'Bebidas geladas entregues em até 30 minutos', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1200', '/products', 2);
