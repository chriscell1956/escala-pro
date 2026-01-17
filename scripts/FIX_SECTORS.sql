-- FIX FINAL: Unicidade dos Setores
-- O código de migração precisa saber que (nome + campus) é único para não criar duplicatas.

-- 1. Limpa dados parciais/errados para evitar erro ao criar a regra
TRUNCATE TABLE alocacoes CASCADE;
TRUNCATE TABLE setores CASCADE;
TRUNCATE TABLE vigilantes CASCADE;

-- 2. Adiciona a regra de UNICIDADE (Essencial para o "upsert" funcionar)
ALTER TABLE setores 
ADD CONSTRAINT setores_nome_campus_key UNIQUE (nome, campus);

-- 3. Garante que vigilantes também tenha unicidade na matrícula (geralmente já tem)
ALTER TABLE vigilantes DROP CONSTRAINT IF EXISTS vigilantes_matricula_key;
ALTER TABLE vigilantes ADD CONSTRAINT vigilantes_matricula_key UNIQUE (matricula);
