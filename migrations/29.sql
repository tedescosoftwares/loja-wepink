
-- Populate Ambev distribution centers for all Brazilian states
INSERT INTO distribution_centers (name, address, latitude, longitude, state_code, city, region, phone, email, operating_hours, delivery_radius_km, is_active) VALUES

-- São Paulo (SP)
('Ambev Centro SP - Zona Sul', 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100', -23.5629, -46.6544, 'SP', 'São Paulo', 'Sudeste', '(11) 3000-1000', 'sp.sul@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro SP - Zona Norte', 'Av. Marginal Tietê, 500 - Vila Jaguara, São Paulo - SP, 05118-100', -23.5000, -46.6833, 'SP', 'São Paulo', 'Sudeste', '(11) 3000-1001', 'sp.norte@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro SP - ABC Paulista', 'Av. Industrial, 1200 - Centro, São Bernardo do Campo - SP, 09750-000', -23.6939, -46.5644, 'SP', 'São Bernardo do Campo', 'Sudeste', '(11) 3000-1002', 'sp.abc@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro SP - Campinas', 'Av. John Boyd Dunlop, 800 - Jardim Ipaussurama, Campinas - SP, 13060-904', -22.8305, -47.0608, 'SP', 'Campinas', 'Sudeste', '(19) 3000-1003', 'sp.campinas@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro SP - Sorocaba', 'Av. General Carneiro, 1500 - Centro, Sorocaba - SP, 18010-000', -23.5018, -47.4589, 'SP', 'Sorocaba', 'Sudeste', '(15) 3000-1004', 'sp.sorocaba@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Rio de Janeiro (RJ)  
('Ambev Centro RJ - Capital', 'Av. Brasil, 2000 - Centro, Rio de Janeiro - RJ, 20040-020', -22.9035, -43.2096, 'RJ', 'Rio de Janeiro', 'Sudeste', '(21) 3000-2000', 'rj.capital@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro RJ - Niterói', 'Av. Ernani do Amaral Peixoto, 500 - Centro, Niterói - RJ, 24020-070', -22.8835, -43.1196, 'RJ', 'Niterói', 'Sudeste', '(21) 3000-2001', 'rj.niteroi@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro RJ - Duque de Caxias', 'Av. Presidente Vargas, 1000 - Centro, Duque de Caxias - RJ, 25010-010', -22.7856, -43.3117, 'RJ', 'Duque de Caxias', 'Sudeste', '(21) 3000-2002', 'rj.caxias@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Minas Gerais (MG)
('Ambev Centro MG - Belo Horizonte', 'Av. Afonso Pena, 1500 - Centro, Belo Horizonte - MG, 30130-005', -19.9191, -43.9386, 'MG', 'Belo Horizonte', 'Sudeste', '(31) 3000-3000', 'mg.bh@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro MG - Uberlândia', 'Av. João Naves de Ávila, 2000 - Santa Mônica, Uberlândia - MG, 38408-100', -18.9113, -48.2622, 'MG', 'Uberlândia', 'Sudeste', '(34) 3000-3001', 'mg.uberlandia@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro MG - Juiz de Fora', 'Av. Barão do Rio Branco, 800 - Centro, Juiz de Fora - MG, 36010-010', -21.7587, -43.3496, 'MG', 'Juiz de Fora', 'Sudeste', '(32) 3000-3002', 'mg.jf@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Paraná (PR)
('Ambev Centro PR - Curitiba', 'Av. Cândido de Abreu, 500 - Centro Cívico, Curitiba - PR, 80530-000', -25.4284, -49.2733, 'PR', 'Curitiba', 'Sul', '(41) 3000-4000', 'pr.curitiba@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro PR - Londrina', 'Av. Higienópolis, 1000 - Centro, Londrina - PR, 86020-911', -23.3045, -51.1696, 'PR', 'Londrina', 'Sul', '(43) 3000-4001', 'pr.londrina@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro PR - Maringá', 'Av. Brasil, 800 - Centro, Maringá - PR, 87013-100', -23.4273, -51.9375, 'PR', 'Maringá', 'Sul', '(44) 3000-4002', 'pr.maringa@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Rio Grande do Sul (RS)
('Ambev Centro RS - Porto Alegre', 'Av. Ipiranga, 1000 - Centro, Porto Alegre - RS, 90010-150', -30.0346, -51.2177, 'RS', 'Porto Alegre', 'Sul', '(51) 3000-5000', 'rs.poa@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro RS - Caxias do Sul', 'Av. Júlio de Castilhos, 500 - Centro, Caxias do Sul - RS, 95020-472', -29.1678, -51.1794, 'RS', 'Caxias do Sul', 'Sul', '(54) 3000-5001', 'rs.caxias@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro RS - Pelotas', 'Av. Bento Gonçalves, 800 - Centro, Pelotas - RS, 96015-140', -31.7654, -52.3376, 'RS', 'Pelotas', 'Sul', '(53) 3000-5002', 'rs.pelotas@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Santa Catarina (SC)
('Ambev Centro SC - Florianópolis', 'Av. Mauro Ramos, 500 - Centro, Florianópolis - SC, 88020-300', -27.5954, -48.5480, 'SC', 'Florianópolis', 'Sul', '(48) 3000-6000', 'sc.floripa@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro SC - Joinville', 'Av. Juscelino Kubitschek, 1000 - Centro, Joinville - SC, 89201-220', -26.3044, -48.8487, 'SC', 'Joinville', 'Sul', '(47) 3000-6001', 'sc.joinville@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro SC - Blumenau', 'Av. Brasil, 800 - Centro, Blumenau - SC, 89010-100', -26.9194, -49.0661, 'SC', 'Blumenau', 'Sul', '(47) 3000-6002', 'sc.blumenau@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Bahia (BA)
('Ambev Centro BA - Salvador', 'Av. Tancredo Neves, 1000 - Caminho das Árvores, Salvador - BA, 41820-021', -12.9714, -38.5014, 'BA', 'Salvador', 'Nordeste', '(71) 3000-7000', 'ba.salvador@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro BA - Feira de Santana', 'Av. Getúlio Vargas, 800 - Centro, Feira de Santana - BA, 44001-024', -12.2664, -38.9663, 'BA', 'Feira de Santana', 'Nordeste', '(75) 3000-7001', 'ba.feira@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro BA - Vitória da Conquista', 'Av. Luís Viana, 500 - Centro, Vitória da Conquista - BA, 45000-000', -14.8661, -40.8394, 'BA', 'Vitória da Conquista', 'Nordeste', '(77) 3000-7002', 'ba.conquista@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Goiás (GO)
('Ambev Centro GO - Goiânia', 'Av. Goiás, 1000 - Centro, Goiânia - GO, 74023-010', -16.6864, -49.2643, 'GO', 'Goiânia', 'Centro-Oeste', '(62) 3000-8000', 'go.goiania@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro GO - Anápolis', 'Av. Brasil, 800 - Centro, Anápolis - GO, 75024-020', -16.3266, -48.9527, 'GO', 'Anápolis', 'Centro-Oeste', '(62) 3000-8001', 'go.anapolis@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Pernambuco (PE)
('Ambev Centro PE - Recife', 'Av. Boa Viagem, 1000 - Boa Viagem, Recife - PE, 51011-000', -8.0476, -34.8770, 'PE', 'Recife', 'Nordeste', '(81) 3000-9000', 'pe.recife@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro PE - Caruaru', 'Av. Agamenon Magalhães, 500 - Centro, Caruaru - PE, 55002-010', -8.2837, -35.9758, 'PE', 'Caruaru', 'Nordeste', '(81) 3000-9001', 'pe.caruaru@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Ceará (CE)
('Ambev Centro CE - Fortaleza', 'Av. Beira Mar, 1000 - Meireles, Fortaleza - CE, 60165-121', -3.7172, -38.5433, 'CE', 'Fortaleza', 'Nordeste', '(85) 3000-1000', 'ce.fortaleza@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro CE - Sobral', 'Av. Dom José, 500 - Centro, Sobral - CE, 62010-000', -3.6880, -40.3492, 'CE', 'Sobral', 'Nordeste', '(88) 3000-1001', 'ce.sobral@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),

-- Espírito Santo (ES)
('Ambev Centro ES - Vitória', 'Av. Fernando Ferrari, 1000 - Goiabeiras, Vitória - ES, 29075-010', -20.2976, -40.2958, 'ES', 'Vitória', 'Sudeste', '(27) 3000-1100', 'es.vitoria@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1),
('Ambev Centro ES - Serra', 'Av. Central, 800 - Laranjeiras, Serra - ES, 29165-130', -20.1287, -40.3076, 'ES', 'Serra', 'Sudeste', '(27) 3000-1101', 'es.serra@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 8h às 14h', 80, 1);
