
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Hardcoded Credentials
const supabaseUrl = "https://uiqelqgurmczmrsdeipn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function restore() {
    console.log("🚀 Starting SMART Restoration...");

    try {
        // 1. Load Backup
        const backupPath = path.resolve(__dirname, 'backup_ers_full.json');
        if (!fs.existsSync(backupPath)) process.exit(1);
        const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

        // 2. Map Old ID -> Matricula
        const oldIdToMat = new Map();
        if (backup.vigilantes_raw) {
            backup.vigilantes_raw.forEach(v => {
                if (v.id && v.matricula) {
                    oldIdToMat.set(v.id, String(v.matricula).trim());
                }
            });
        }
        console.log(`📂 Loaded ${oldIdToMat.size} vigilantes from backup.`);

        // 3. Fetch Cloud Vigilantes (Map Matricula -> New ID)
        const { data: cloudVigs, error: errV } = await supabase
            .from('vigilantes')
            .select('id, matricula');

        if (errV) throw errV;

        const matToNewId = new Map();
        cloudVigs.forEach(v => {
            if (v.matricula) {
                matToNewId.set(String(v.matricula).trim(), v.id);
            }
        });
        console.log(`☁️  Loaded ${matToNewId.size} vigilantes from Cloud DB.`);

        // 4. Remap Allocations
        const allocations = backup.alocacoes_raw || [];
        const payload = [];

        allocations.forEach(a => {
            const mat = oldIdToMat.get(a.vigilante_id);
            if (!mat) {
                // console.warn(`⚠️ Skipping alloc for unknown old ID: ${a.vigilante_id}`);
                return;
            }

            const newId = matToNewId.get(mat);
            if (!newId) {
                // console.warn(`⚠️ Skipping alloc. Vigilante ${mat} not found in Cloud DB.`);
                return;
            }

            payload.push({
                id: a.id, // Keep ID if possible to avoid dupes, or let it regen? 
                // Better keep ID if it's UUID. If it's serial (int), we might have conflict?
                // Backup IDs seem to be UUIDs "1186986f...".
                // If cloud uses UUIDs, it's fine.
                vigilante_id: newId,
                setor_id: a.setor_id, // Assumption: Sector IDs match?
                // Sectors might ALSO have changed IDs. 
                // But sectors are static usually.
                // Let's assume Sector IDs match for now. 
                // If this fails on Sector FK, we'll need to map Sectors too.
                data: a.data,
                tipo: a.tipo || "NORMAL",
                // created_at: a.created_at // Let it refresh or keep
            });
        });

        console.log(`🔄 Remapped ${payload.length} allocations.`);

        if (payload.length === 0) {
            console.log("❌ No allocations to insert.");
            return;
        }

        // 5. Batch Insert
        const batchSize = 100;
        let successCount = 0;

        for (let i = 0; i < payload.length; i += batchSize) {
            const batch = payload.slice(i, i + batchSize);
            const { error } = await supabase
                .from('alocacoes')
                .upsert(batch, { onConflict: 'id' });

            if (error) {
                console.error(`❌ Error inserting batch ${i}:`, error.message);
                // If error is Sector FK, we halt.
                if (error.message.includes('alocacoes_setor_id_fkey')) {
                    console.error("CRITICAL: Sector IDs mismatch. Skipping Allocations.");
                    break;
                }
            } else {
                successCount += batch.length;
                console.log(`✅ Restored ${Math.min(i + batchSize, payload.length)} / ${payload.length}`);
            }
        }

    } catch (e) {
        console.error("❌ Fatal Error:", e);
    }
}

restore();
