-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    vigilante_id INT REFERENCES vigilantes(id), -- Nullable for System Admins
    matricula VARCHAR(50) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('MASTER', 'FISCAL', 'USER')),
    primeiro_acesso BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON usuarios(matricula);

-- 3. Seed Initial Master User (Password: 123456)
-- We check if 'MASTER' already exists to avoid duplicates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE matricula = 'MASTER') THEN
        INSERT INTO usuarios (matricula, senha, role, primeiro_acesso)
        VALUES ('MASTER', '$2b$10$fpXCp.2Nbg4pqQz51bMXculEXd1n48668QNSh7ReprKKEXvZRxDoo2', 'MASTER', TRUE);
    END IF;
END $$;
