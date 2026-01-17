-- FIXED SCHEMA (Integer Foreign Keys) - VERSÃO CORRIGIDA
-- IDs dos vigilantes e setores são NÚMEROS (Integer), então usaremos BIGINT.

-- 1. Create ALOCACOES table (Fixed Types for Integer FKs)
CREATE TABLE IF NOT EXISTS alocacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID da alocação pode ser UUID sem problemas
    vigilante_id BIGINT REFERENCES vigilantes(id) ON DELETE CASCADE, -- CONEXÃO COM VIGILANTE (NUMÉRICO)
    setor_id BIGINT REFERENCES setores(id) ON DELETE SET NULL,     -- CONEXÃO COM SETOR (NUMÉRICO)
    data DATE NOT NULL,
    horario_inicio TIME, 
    horario_fim TIME,
    tipo TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(vigilante_id, data) 
);

-- 2. Create USUARIOS table
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mat TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    role TEXT CHECK (role IN ('MASTER', 'FISCAL', 'USER')) DEFAULT 'USER',
    password TEXT DEFAULT '123456',
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. JORNADAS
CREATE TABLE IF NOT EXISTS jornadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL, 
    inicio TIME, 
    fim TIME, 
    intervalo_inicio TIME DEFAULT NULL,
    intervalo_fim TIME DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. SETOR_JORNADA
CREATE TABLE IF NOT EXISTS setor_jornada (
    setor_id BIGINT REFERENCES setores(id) ON DELETE CASCADE,   -- NUMÉRICO AQUI TAMBÉM
    jornada_id UUID REFERENCES jornadas(id) ON DELETE CASCADE,
    PRIMARY KEY (setor_id, jornada_id)
);

-- PERMISSIONS
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
