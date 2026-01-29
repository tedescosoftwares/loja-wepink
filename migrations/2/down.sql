
-- Restore original data
DELETE FROM products;
DELETE FROM categories;
DELETE FROM banners;

INSERT INTO categories (name, description, image_url) VALUES 
('Eletrônicos', 'Produtos eletrônicos e tecnologia', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
('Roupas', 'Moda e vestuário', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'),
('Casa & Jardim', 'Itens para casa e decoração', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'),
('Esportes', 'Artigos esportivos e fitness', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400');

INSERT INTO products (name, description, price, original_price, image_url, category_id, is_featured, stock_quantity) VALUES 
('Smartphone Pro', 'Smartphone com câmera profissional e bateria de longa duração', 1299.99, 1499.99, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 1, 1, 10),
('Notebook Ultrabook', 'Notebook leve e potente para trabalho e estudos', 2499.99, null, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 1, 1, 5),
('Camiseta Premium', 'Camiseta de algodão premium, confortável e durável', 79.99, 99.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 2, 0, 25),
('Jeans Classic', 'Calça jeans clássica, corte moderno', 149.99, null, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 2, 0, 15),
('Kit Panelas', 'Conjunto de panelas antiaderentes', 299.99, 399.99, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 3, 1, 8),
('Tênis Running', 'Tênis para corrida com tecnologia de amortecimento', 199.99, null, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 4, 1, 20);

INSERT INTO banners (title, subtitle, image_url, link_url, display_order) VALUES 
('Mega Promoção!', 'Até 50% OFF em produtos selecionados', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', '/products', 1),
('Frete Grátis', 'Em compras acima de R$ 200', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200', '/products', 2);
