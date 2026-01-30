
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
// ANON KEY (Same as ClientAdapter)
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function simulateSave() {
    console.log("🚀 Starting Save Simulation...");

    // PAYLOAD MOCK (As user described)
    // "Wesley", Team D, "Alfa 1"
    const vigilantes = [{
        mat: "TEST_WES_01",
        nome: "WESLEY SIMULATION",
        eq: "D",
        setor: "ALFA 1", // Name lookup
        campus: "CAMPUS I",
        dias: [5, 6, 7]
    }];
    const monthStr = "202601";

    // --- LOGIC FROM ClientAdapter.saveEscala ---
    try {
        const year = parseInt(monthStr.substring(0, 4));
        const monthNum = parseInt(monthStr.substring(4, 6));
        const dateFormat = `${year}-${String(monthNum).padStart(2, "0")}`;

        console.log(`[SIM] Saving ${vigilantes.length} vigilantes...`);

        // 1. SYNC PROFILES
        console.log("1. Fetching IDs...");
        const { data: currentVigs, error: eqErr } = await supabase
            .from("vigilantes")
            .select("id, matricula");

        if (eqErr) console.error("❌ Error fetching vigs:", eqErr);

        const currentMap = new Map();
        (currentVigs || []).forEach((v) =>
            currentMap.set(String(v.matricula).trim(), v.id)
        );

        const vigilantesToSync = vigilantes.map((v) => {
            const cleanMat = String(v.mat || "").trim();
            const existingId = currentMap.get(cleanMat);
            const p = {
                matricula: cleanMat,
                nome: v.nome,
                ativo: true
            };
            if (existingId) p.id = existingId;
            return p;
        });

        console.log("2. Upserting Profiles...", vigilantesToSync);
        const { data: upsertData, error: upsertErr } = await supabase
            .from("vigilantes")
            .upsert(vigilantesToSync, { onConflict: "matricula" })
            .select();

        if (upsertErr) {
            console.error("❌ Error syncing profiles:", upsertErr);
            // IF RLS BLOCKS THIS, WE FAIL HERE.
        } else {
            console.log("✅ Profiles Synced. Data:", upsertData);
            // Update Map
            (upsertData || []).forEach(v => currentMap.set(v.matricula, v.id));
        }

        // 2. PREPARE ALLOCATIONS
        console.log("3. Fetching Sectors...");
        const { data: allSectors } = await supabase.from("setores").select("id, nome, campus");
        const sectorMapByKey = new Map();

        (allSectors || []).forEach((s) => {
            sectorMapByKey.set(
                `${String(s.nome).trim().toUpperCase()}|${String(s.campus).trim().toUpperCase()}`,
                s
            );
        });

        const newAllocations = [];
        const allVigMatriculas = [];

        for (const v of vigilantes) {
            const cleanMat = String(v.mat || "").trim();
            allVigMatriculas.push(cleanMat);

            const vigUuid = currentMap.get(cleanMat);
            if (!vigUuid) {
                console.warn(`❌ UUID missing for ${cleanMat} (Upsert failed?)`);
                continue;
            }

            let setUuid = null;
            const key = `${String(v.setor).trim().toUpperCase()}|${String(v.campus).trim().toUpperCase()}`;
            const sFound = sectorMapByKey.get(key);
            if (sFound) {
                setUuid = sFound.id;
                console.log(`✅ Sector Resolved: ${key} -> ${setUuid}`);
            } else {
                console.warn(`⚠️ Sector NOT Found: ${key}`);
            }

            v.dias.forEach((day) => {
                newAllocations.push({
                    vigilante_id: vigUuid,
                    data: `${dateFormat}-${String(day).padStart(2, "0")}`,
                    setor_id: setUuid,
                    tipo: v.eq || "A"
                });
            });
        }

        // 3. DELETE OLD
        const vigIdsToDelete = allVigMatriculas.map(m => currentMap.get(m)).filter(id => id);
        console.log("4. Deleting Old Allocations for:", vigIdsToDelete);

        const { error: delErr, count: delCount } = await supabase
            .from("alocacoes")
            .delete({ count: 'exact' })
            .in("vigilante_id", vigIdsToDelete)
            .gte("data", `${dateFormat}-01`)
            .lte("data", `${dateFormat}-31`);

        if (delErr) console.error("❌ Delete Error:", delErr);
        else console.log(`✅ Deleted ${delCount} rows.`);

        // 4. INSERT NEW
        console.log(`5. Inserting ${newAllocations.length} rows...`, newAllocations);
        const { error: insErr, data: insData } = await supabase
            .from("alocacoes")
            .insert(newAllocations)
            .select();

        if (insErr) console.error("❌ Insert Error:", insErr);
        else console.log("✅ Insert Success:", insData ? insData.length : "OK");

    } catch (e) {
        console.error("EXCEPTION:", e);
    }
}

simulateSave();
