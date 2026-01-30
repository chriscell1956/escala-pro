
-- ⚠️ IMPORTANT: RUN THIS IN SUPABASE SQL EDITOR ⚠️

-- Since we moved to a "Serverless" architecture (Client-Side),
-- the application connects directly to the database using the Public Key.
-- We must allow the application to Save/Delete data.

-- 1. VIGILANTES
DROP POLICY IF EXISTS "Enable all access for anon" ON "public"."vigilantes";
CREATE POLICY "Enable all access for anon" ON "public"."vigilantes"
AS PERMISSIVE FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 2. ALOCACOES (The Schedule)
DROP POLICY IF EXISTS "Enable all access for anon" ON "public"."alocacoes";
CREATE POLICY "Enable all access for anon" ON "public"."alocacoes"
AS PERMISSIVE FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 3. SETORES (Presets)
DROP POLICY IF EXISTS "Enable all access for anon" ON "public"."setores";
CREATE POLICY "Enable all access for anon" ON "public"."setores"
AS PERMISSIVE FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 4. Enable RLS (if not already) but with open policies above
ALTER TABLE "public"."vigilantes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."alocacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."setores" ENABLE ROW LEVEL SECURITY;
