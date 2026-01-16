-- Migration to add `equipe` to `setores` and `refeicao` to `setor_jornada`
-- Run this in Supabase SQL Editor

ALTER TABLE setores ADD COLUMN IF NOT EXISTS equipe VARCHAR(5);
ALTER TABLE setor_jornada ADD COLUMN IF NOT EXISTS refeicao VARCHAR(20);

-- Update existing rows (optional)
UPDATE setores SET equipe = 'A' WHERE equipe IS NULL;
