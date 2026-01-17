-- SQL Cleanup Script (SAFE VERSION)
-- 1. KEEP 'usuarios' (for future Login)
-- 2. KEEP 'alocacoes' (Core Relational Table)

-- 3. Drop legacy columns from 'vigilantes'
ALTER TABLE vigilantes DROP COLUMN IF EXISTS equipe_padrao;
ALTER TABLE vigilantes DROP COLUMN IF EXISTS setor_id_padrao;

-- 4. Drop legacy columns from 'setores'
ALTER TABLE setores DROP COLUMN IF EXISTS equipe;

-- 5. Drop unused 'escala_*' tables (APPROVED)
-- Using CASCADE to remove links from other tables (like solicitacoes_folga) without deleting them
DROP TABLE IF EXISTS escala_vigilantes CASCADE;
DROP TABLE IF EXISTS escala_setores CASCADE;
DROP TABLE IF EXISTS escala_mensal CASCADE;
