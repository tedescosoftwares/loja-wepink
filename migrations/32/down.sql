
-- Remover os centros de distribuição adicionados
DELETE FROM distribution_centers WHERE name LIKE 'Ambev %' AND created_at >= datetime('now', '-1 minute');
