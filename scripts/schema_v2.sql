-- 0. Reset (Drop all tables to start fresh as requested)
DROP TABLE IF EXISTS vigilantes CASCADE;
DROP TABLE IF EXISTS setores CASCADE;
DROP TABLE IF EXISTS horarios_almoco CASCADE;

-- Also dropping old tables if you want to fully clean up (Comment out if you want to keep them for backup)
-- DROP TABLE IF EXISTS escalas CASCADE; 
-- DROP TABLE IF EXISTS users CASCADE; 

-- 1. Vigilantes
CREATE TABLE vigilantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cargo TEXT DEFAULT 'Vigilante',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Setores (Sectors)
CREATE TABLE setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    campus TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(nome, campus)
);

-- 3. Horarios de Almoco (Lunch Hours)
CREATE TABLE horarios_almoco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT UNIQUE NOT NULL, -- e.g. "11h - 12h"
    inicio TIME, -- Optional: parsed time
    fim TIME, -- Optional: parsed time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security) - Optional but validation good practice default
ALTER TABLE vigilantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_almoco ENABLE ROW LEVEL SECURITY;

-- Policies (Open for now as per previous simplicity, or restrict if needed)
CREATE POLICY "Enable read/write for all" ON vigilantes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for all" ON setores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for all" ON horarios_almoco FOR ALL USING (true) WITH CHECK (true);
