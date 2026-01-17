-- SCHEMA COMPLETION: Missing Tables for "Escala Pro"
-- This script adds the tables required to support the Legacy Frontend Adapter.

-- 1. USUARIOS (Users/Auth)
-- Maps to: api/users logic
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mat TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    role TEXT CHECK (role IN ('MASTER', 'FISCAL', 'USER')) DEFAULT 'USER',
    password TEXT DEFAULT '123456', -- Default legacy password
    permissions JSONB DEFAULT '[]'::jsonb, -- Stores [{team: "A", canEdit: true}, ...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. JORNADAS (Shift Definitions)
-- e.g. "12x36 Diurno", "Expediente"
CREATE TABLE IF NOT EXISTS jornadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL, -- e.g. "12x36_DIURNO"
    inicio TIME, -- "06:00"
    fim TIME, -- "18:00"
    intervalo_inicio TIME DEFAULT NULL,
    intervalo_fim TIME DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ALOCACOES (The Core Schedule)
-- Relates Vigilante <-> Setor <-> Date
-- Replaces/Populates the "days" array in legacy JSON
CREATE TABLE IF NOT EXISTS alocacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vigilante_id UUID REFERENCES vigilantes(id) ON DELETE CASCADE,
    setor_id UUID REFERENCES setores(id) ON DELETE SET NULL, -- specific sector for this day
    data DATE NOT NULL,
    horario_inicio TIME, -- Override or specific time
    horario_fim TIME,
    tipo TEXT, -- e.g. "EXTRA", "NORMAL", "COBERTURA"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(vigilante_id, data) -- A guard can't apply twice on same day (normally)
);

-- 4. AFASTAMENTOS (Absences/Leaves)
-- Used to populate "faltas", "saidasAntecipadas" or specific status
CREATE TABLE IF NOT EXISTS afastamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vigilante_id UUID REFERENCES vigilantes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- "FALTA", "ATESTADO", "SUSPENSAO", "SAIDA_ANTECIPADA"
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. FERIAS (Vacations)
-- Maps to "vacation": { start, end } in JSON
CREATE TABLE IF NOT EXISTS ferias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vigilante_id UUID REFERENCES vigilantes(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    mes_referencia INTEGER, -- e.g. 202501
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. LOGS (Audit)
-- Maps to "logs" in JSON
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp BIGINT NOT NULL, -- Javascript timestamp (epoch ms)
    action TEXT NOT NULL,
    user_matricula TEXT NOT NULL,
    user_name TEXT,
    details TEXT,
    target_item_id TEXT, -- formatted ID or resource ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. SETOR_JORNADA (Relation N:N)
-- Links Sectors to valid Shifts (for validation)
CREATE TABLE IF NOT EXISTS setor_jornada (
    setor_id UUID REFERENCES setores(id) ON DELETE CASCADE,
    jornada_id UUID REFERENCES jornadas(id) ON DELETE CASCADE,
    PRIMARY KEY (setor_id, jornada_id)
);

-- GRANT PERMISSIONS (Just to be safe for the API user)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
