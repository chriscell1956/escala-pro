-- Hashes para senha '123456'
-- $2b$10$fpXCp.2Nbg4pqQz51bMXculEXd1n48668QNSh7ReprKKEXvZRxDoo2

-- 1. Inserir MASTER (91611)
INSERT INTO usuarios (matricula, senha, role, primeiro_acesso)
VALUES ('91611', '$2b$10$fpXCp.2Nbg4pqQz51bMXculEXd1n48668QNSh7ReprKKEXvZRxDoo2', 'MASTER', TRUE)
ON CONFLICT (matricula) DO NOTHING;

-- 2. Inserir FISCAL (100178)
INSERT INTO usuarios (matricula, senha, role, primeiro_acesso)
VALUES ('100178', '$2b$10$fpXCp.2Nbg4pqQz51bMXculEXd1n48668QNSh7ReprKKEXvZRxDoo2', 'FISCAL', TRUE)
ON CONFLICT (matricula) DO NOTHING;

-- 3. Inserir USER (55022)
INSERT INTO usuarios (matricula, senha, role, primeiro_acesso)
VALUES ('55022', '$2b$10$fpXCp.2Nbg4pqQz51bMXculEXd1n48668QNSh7ReprKKEXvZRxDoo2', 'USER', TRUE)
ON CONFLICT (matricula) DO NOTHING;
