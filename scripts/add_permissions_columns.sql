-- Add Permission Columns to USUARIOS table
-- We use snake_case for DB columns

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS can_manage_intervals BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS can_view_logs BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS can_print BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS can_simulate BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS can_view_cftv BOOLEAN DEFAULT FALSE;

-- Notify success
SELECT 'Permissions columns added successfully' as result;
