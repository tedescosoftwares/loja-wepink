
-- Reverter as atualizações de categoria e remover os novos produtos
UPDATE products SET category_id = 1 WHERE category_id IN (SELECT id FROM categories WHERE name IN ('Coca-Cola', 'Antarctica', 'Crystal', 'Del Valle', 'Skol', 'Red Bull', 'Pepsi', 'Brahma', 'Heineken'));
DELETE FROM products WHERE id > 6;
