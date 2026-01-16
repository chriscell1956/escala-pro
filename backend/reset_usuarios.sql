-- ⚠️ WARNING: THIS WILL DELETE EXISTING USERS IF ANY ⚠️
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. Create Users Table (Clean State)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    vigilante_id INT REFERENCES vigilantes(id), 
    matricula VARCHAR(50) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('MASTER', 'FISCAL', 'USER')),
    primeiro_acesso BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Index
CREATE INDEX idx_usuarios_matricula ON usuarios(matricula);

-- 3. Seed Initial Master User
-- Password: '123456' -> $2b$10$fpXCp.2Nbg4pqQz51bMXculEXd1n48668QNSh7ReprKKEXvZRxDoo2
INSERT INTO usuarios (matricula, senha, role, primeiro_acesso)
VALUES ('MASTER', '$2b$10$fpXCp.2Nbg4pqQz51bMXculEXd1n48668QNSh7ReprKKEXvZRxDoo2', 'MASTER', TRUE);
