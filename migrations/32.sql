
-- Adicionar mais centros de distribuição Ambev em diferentes regiões do Brasil

-- São Paulo - Região Metropolitana
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev São Paulo - Vila Leopoldina', 'Av. Marginal Pinheiros, 7800 - Vila Leopoldina, São Paulo - SP', -23.5276, -46.7130, '(11) 2122-1000', 'saopaulo@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 60, 'SP', 'São Paulo', 'Sudeste', 1),
('Ambev Guarulhos - Centro de Distribuição', 'Rodovia Presidente Dutra, km 225 - Guarulhos - SP', -23.4044, -46.4849, '(11) 2122-1010', 'guarulhos@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 70, 'SP', 'Guarulhos', 'Sudeste', 1),
('Ambev Campinas - Centro Logístico', 'Rod. Santos Dumont, km 58 - Campinas - SP', -22.8540, -47.1962, '(19) 2122-2000', 'campinas@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 12h', 80, 'SP', 'Campinas', 'Sudeste', 1),
('Ambev Ribeirão Preto - Regional', 'Av. Presidente Vargas, 2100 - Ribeirão Preto - SP', -21.1699, -47.8099, '(16) 2122-3000', 'ribeirao@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 90, 'SP', 'Ribeirão Preto', 'Sudeste', 1);

-- Rio de Janeiro
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Rio de Janeiro - Centro de Distribuição', 'Av. Brasil, 22500 - Parada de Lucas, Rio de Janeiro - RJ', -22.8104, -43.2654, '(21) 2122-4000', 'rio@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 65, 'RJ', 'Rio de Janeiro', 'Sudeste', 1),
('Ambev Duque de Caxias - Logística', 'Rod. Washington Luiz, km 10 - Duque de Caxias - RJ', -22.7859, -43.3055, '(21) 2122-4010', 'caxias@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 60, 'RJ', 'Duque de Caxias', 'Sudeste', 1),
('Ambev Volta Redonda - Regional Sul Fluminense', 'BR-393, km 108 - Volta Redonda - RJ', -22.5230, -44.1040, '(24) 2122-5000', 'voltaredonda@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 75, 'RJ', 'Volta Redonda', 'Sudeste', 1);

-- Minas Gerais
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Belo Horizonte - Centro de Distribuição', 'Av. Amazonas, 7500 - Gameleira, Belo Horizonte - MG', -19.9512, -44.0139, '(31) 2122-6000', 'bh@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 70, 'MG', 'Belo Horizonte', 'Sudeste', 1),
('Ambev Contagem - Centro Logístico', 'Rod. BR-381, km 419 - Contagem - MG', -19.9319, -44.0540, '(31) 2122-6010', 'contagem@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 65, 'MG', 'Contagem', 'Sudeste', 1),
('Ambev Uberlândia - Regional Triângulo Mineiro', 'Av. João Naves de Ávila, 3500 - Uberlândia - MG', -18.9021, -48.2588, '(34) 2122-7000', 'uberlandia@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 85, 'MG', 'Uberlândia', 'Sudeste', 1),
('Ambev Juiz de Fora - Regional Zona da Mata', 'BR-040, km 796 - Juiz de Fora - MG', -21.7587, -43.3508, '(32) 2122-7010', 'juizdefora@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 70, 'MG', 'Juiz de Fora', 'Sudeste', 1);

-- Paraná
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Curitiba - Centro de Distribuição', 'Av. das Torres, 500 - CIC, Curitiba - PR', -25.5290, -49.3543, '(41) 2122-8000', 'curitiba@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 75, 'PR', 'Curitiba', 'Sul', 1),
('Ambev Londrina - Regional Norte do Paraná', 'Av. Saul Elkind, 1200 - Londrina - PR', -23.2942, -51.1623, '(43) 2122-8010', 'londrina@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 90, 'PR', 'Londrina', 'Sul', 1),
('Ambev Maringá - Centro Logístico', 'Av. Colombo, 7300 - Maringá - PR', -23.4205, -51.9331, '(44) 2122-8020', 'maringa@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 80, 'PR', 'Maringá', 'Sul', 1);

-- Rio Grande do Sul
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Porto Alegre - Centro de Distribuição', 'Av. Assis Brasil, 8800 - Sarandi, Porto Alegre - RS', -30.0277, -51.1575, '(51) 2122-9000', 'poa@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 70, 'RS', 'Porto Alegre', 'Sul', 1),
('Ambev Caxias do Sul - Regional Serra Gaúcha', 'RS-122, km 60 - Caxias do Sul - RS', -29.1678, -51.1794, '(54) 2122-9010', 'caxias@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 85, 'RS', 'Caxias do Sul', 'Sul', 1),
('Ambev Pelotas - Regional Sul', 'BR-392, km 45 - Pelotas - RS', -31.7718, -52.3374, '(53) 2122-9020', 'pelotas@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 90, 'RS', 'Pelotas', 'Sul', 1);

-- Santa Catarina
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Florianópolis - Centro de Distribuição', 'SC-401, km 10 - São José - SC', -27.6103, -48.6350, '(48) 2122-9500', 'floripa@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 75, 'SC', 'Florianópolis', 'Sul', 1),
('Ambev Joinville - Regional Norte', 'Rua Albano Schmidt, 3300 - Joinville - SC', -26.3044, -48.8487, '(47) 2122-9510', 'joinville@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 80, 'SC', 'Joinville', 'Sul', 1),
('Ambev Blumenau - Centro Logístico', 'Rua 2 de Setembro, 2500 - Blumenau - SC', -26.9194, -49.0661, '(47) 2122-9520', 'blumenau@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 75, 'SC', 'Blumenau', 'Sul', 1);

-- Bahia  
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Salvador - Centro de Distribuição', 'Av. Luís Viana Filho, 8100 - Paralela, Salvador - BA', -12.9704, -38.4647, '(71) 2122-1100', 'salvador@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 80, 'BA', 'Salvador', 'Nordeste', 1),
('Ambev Feira de Santana - Regional Recôncavo', 'BR-324, km 104 - Feira de Santana - BA', -12.2662, -38.9663, '(75) 2122-1110', 'feira@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 85, 'BA', 'Feira de Santana', 'Nordeste', 1),
('Ambev Vitória da Conquista - Regional Sudoeste', 'BR-415, km 5 - Vitória da Conquista - BA', -14.8619, -40.8440, '(77) 2122-1120', 'conquista@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 95, 'BA', 'Vitória da Conquista', 'Nordeste', 1);

-- Pernambuco
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Recife - Centro de Distribuição', 'Av. Norte, 5000 - Distrito Industrial, Recife - PE', -8.0476, -34.9013, '(81) 2122-1200', 'recife@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 75, 'PE', 'Recife', 'Nordeste', 1),
('Ambev Caruaru - Regional Agreste', 'BR-232, km 112 - Caruaru - PE', -8.2837, -35.9765, '(87) 2122-1210', 'caruaru@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 80, 'PE', 'Caruaru', 'Nordeste', 1);

-- Ceará
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Fortaleza - Centro de Distribuição', 'Av. Senador Fernandes Távora, 1500 - Fortaleza - CE', -3.7319, -38.5267, '(85) 2122-1300', 'fortaleza@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 85, 'CE', 'Fortaleza', 'Nordeste', 1),
('Ambev Sobral - Regional Norte do Ceará', 'Av. Dr. Guarani, 1000 - Sobral - CE', -3.6956, -40.3492, '(88) 2122-1310', 'sobral@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 90, 'CE', 'Sobral', 'Nordeste', 1);

-- Goiás
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Goiânia - Centro de Distribuição', 'Av. Anhanguera, 8500 - Setor Aeroviário, Goiânia - GO', -16.6869, -49.2648, '(62) 2122-1400', 'goiania@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 80, 'GO', 'Goiânia', 'Centro-Oeste', 1),
('Ambev Anápolis - Centro Logístico', 'BR-153, km 42 - Anápolis - GO', -16.3269, -48.9533, '(62) 2122-1410', 'anapolis@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 85, 'GO', 'Anápolis', 'Centro-Oeste', 1);

-- Espírito Santo
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Vitória - Centro de Distribuição', 'Av. Dário Lourenço de Souza, 790 - Jardim América, Cariacica - ES', -20.2976, -40.4195, '(27) 2122-1500', 'vitoria@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 70, 'ES', 'Vitória', 'Sudeste', 1),
('Ambev Cachoeiro de Itapemirim - Regional Sul do ES', 'BR-482, km 8 - Cachoeiro de Itapemirim - ES', -20.8487, -41.1129, '(28) 2122-1510', 'cachoeiro@ambev.com.br', 'Segunda a Sexta: 7h às 17h, Sábado: 7h às 12h', 75, 'ES', 'Cachoeiro de Itapemirim', 'Sudeste', 1);

-- Mato Grosso
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Cuiabá - Centro de Distribuição', 'Av. Fernando Corrêa da Costa, 3000 - Cuiabá - MT', -15.6014, -56.0979, '(65) 2122-1600', 'cuiaba@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 90, 'MT', 'Cuiabá', 'Centro-Oeste', 1);

-- Mato Grosso do Sul
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Campo Grande - Centro de Distribuição', 'Av. Afonso Pena, 5500 - Campo Grande - MS', -20.4697, -54.6201, '(67) 2122-1700', 'campogrande@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 95, 'MS', 'Campo Grande', 'Centro-Oeste', 1);

-- Distrito Federal
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Brasília - Centro de Distribuição', 'SCIA Quadra 1, Lote 1955 - Guará, Brasília - DF', -15.7942, -47.8822, '(61) 2122-1800', 'brasilia@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 70, 'DF', 'Brasília', 'Centro-Oeste', 1);

-- Paraíba
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev João Pessoa - Centro de Distribuição', 'BR-230, km 22 - João Pessoa - PB', -7.1195, -34.8450, '(83) 2122-1900', 'joaopessoa@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 80, 'PB', 'João Pessoa', 'Nordeste', 1);

-- Rio Grande do Norte
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Natal - Centro de Distribuição', 'BR-101, km 12 - Natal - RN', -5.7945, -35.2110, '(84) 2122-2000', 'natal@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 85, 'RN', 'Natal', 'Nordeste', 1);

-- Alagoas
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Maceió - Centro de Distribuição', 'AL-101 Norte, km 8 - Maceió - AL', -9.6498, -35.7089, '(82) 2122-2100', 'maceio@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 75, 'AL', 'Maceió', 'Nordeste', 1);

-- Sergipe
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Aracaju - Centro de Distribuição', 'BR-101, km 98 - Aracaju - SE', -10.9472, -37.0731, '(79) 2122-2200', 'aracaju@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 70, 'SE', 'Aracaju', 'Nordeste', 1);

-- Maranhão
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev São Luís - Centro de Distribuição', 'BR-135, km 8 - São Luís - MA', -2.5388, -44.2825, '(98) 2122-2300', 'saoluis@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 90, 'MA', 'São Luís', 'Nordeste', 1);

-- Piauí
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Teresina - Centro de Distribuição', 'BR-343, km 5 - Teresina - PI', -5.0892, -42.8019, '(86) 2122-2400', 'teresina@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 85, 'PI', 'Teresina', 'Nordeste', 1);

-- Pará
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Belém - Centro de Distribuição', 'BR-316, km 8 - Ananindeua - PA', -1.3656, -48.3739, '(91) 2122-2500', 'belem@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 95, 'PA', 'Belém', 'Norte', 1);

-- Amazonas
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Manaus - Centro de Distribuição', 'Av. Rodrigo Otávio, 3000 - Distrito Industrial, Manaus - AM', -3.1190, -60.0217, '(92) 2122-2600', 'manaus@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 100, 'AM', 'Manaus', 'Norte', 1);

-- Rondônia  
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Porto Velho - Centro de Distribuição', 'BR-364, km 6 - Porto Velho - RO', -8.7612, -63.9004, '(69) 2122-2700', 'portovelho@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 100, 'RO', 'Porto Velho', 'Norte', 1);

-- Acre
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Rio Branco - Centro de Distribuição', 'BR-364, km 2 - Rio Branco - AC', -9.9747, -67.8243, '(68) 2122-2800', 'riobranco@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 120, 'AC', 'Rio Branco', 'Norte', 1);

-- Roraima
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Boa Vista - Centro de Distribuição', 'BR-174, km 5 - Boa Vista - RR', 2.8235, -60.6758, '(95) 2122-2900', 'boavista@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 150, 'RR', 'Boa Vista', 'Norte', 1);

-- Amapá
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Macapá - Centro de Distribuição', 'BR-156, km 10 - Macapá - AP', 0.0389, -51.0664, '(96) 2122-3000', 'macapa@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 120, 'AP', 'Macapá', 'Norte', 1);

-- Tocantins
INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, state_code, city, region, is_active) VALUES
('Ambev Palmas - Centro de Distribuição', 'TO-050, km 2 - Palmas - TO', -10.1689, -48.3317, '(63) 2122-3100', 'palmas@ambev.com.br', 'Segunda a Sexta: 6h às 18h, Sábado: 6h às 14h', 100, 'TO', 'Palmas', 'Norte', 1);
