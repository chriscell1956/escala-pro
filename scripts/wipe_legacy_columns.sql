
-- THIS SCRIPT IS FOR DOCUMENTATION/MANUAL EXECUTION
-- We do not have a direct migration runner, but these are the commands
-- that represent the "Removal" of the columns (Data Wipe).

UPDATE vigilantes SET equipe_padrao = NULL;
UPDATE vigilantes SET setor_id_padrao = NULL;
-- setores.equipe might not exist or be used, depending on schema, but if it does:
-- UPDATE setores SET equipe = NULL;
