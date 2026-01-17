-- SQL Reference to DROP legacy columns
-- Run this in the Supabase SQL Editor

-- 1. Clean up Vigilantes table
ALTER TABLE vigilantes DROP COLUMN IF EXISTS equipe_padrao;
ALTER TABLE vigilantes DROP COLUMN IF EXISTS setor_id_padrao;

-- 2. Clean up Setores table (if 'equipe' column exists)
ALTER TABLE setores DROP COLUMN IF EXISTS equipe;

-- 3. Verify
-- SELECT * FROM vigilantes LIMIT 1;
