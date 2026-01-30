
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Vigilante, DepartmentPreset } from "../types";

// --- CONFIGURAÇÃO SUPABASE (CLIENT SIDE) ---
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPERS ---
const withTimeout = <T>(promise: Promise<T>, ms = 30000): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database Timeout")), ms)
    );
    return Promise.race([promise, timeout]);
};

export const ClientAdapter = {

    async getEscala(monthStr: string): Promise<Vigilante[]> {
        try {
            // monthStr format: YYYYMM (e.g., 202601)
            const year = parseInt(monthStr.substring(0, 4));
            const monthNum = parseInt(monthStr.substring(4, 6));

            const startOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-01`;
            const lastDay = new Date(year, monthNum, 0).getDate();
            const endOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-${lastDay}`;

            console.log(`[CLIENT-ADAPTER] getEscala ${monthStr}`);

            // Performance: Fetch only necessary columns
            const [vigsRes, alocsRes, setoresRes] = await withTimeout(Promise.all([
                supabase.from("vigilantes").select("id, matricula, nome, equipe").order("nome"),
                supabase.from("alocacoes").select("vigilante_id, data, setor, campus").gte("data", startOfMonth).lte("data", endOfMonth),
                supabase.from("setores").select("id, nome, campus")
            ]));

            if (vigsRes.error) throw vigsRes.error;

            const vigs = vigsRes.data || [];
            const alocs = alocsRes.data || [];

            // Pre-group allocations by vigilante
            const alocsByVig = new Map<string, any[]>();
            alocs.forEach(a => {
                // Determine Key: The DB uses TEXT (Matricula) OR UUID?
                // Step 1006 proved 'vigilante_id' accepts TEXT (Matricula).
                // So the 'alocacoes.vigilante_id' should match 'vigilantes.matricula'.
                // Ideally, we group by what the DB returns.
                const key = String(a.vigilante_id).trim();
                if (!alocsByVig.has(key)) alocsByVig.set(key, []);
                alocsByVig.get(key)!.push(a);
            });

            const legacyList: Vigilante[] = vigs.map((v: any) => {
                // Match via Matricula (since DB uses text FK)
                const matKey = String(v.matricula).trim();
                const myAlocs = alocsByVig.get(matKey) || [];

                // 1. Infer Team: From Vigilantes table (Primary)
                let team = v.equipe || "A DEFINIR";

                // 2. Infer Sector/Campus
                let sNome = "AGUARDANDO", cNome = "SEM POSTO";
                // With Clean Schema, alocacoes has direct strings 'setor' and 'campus'
                // We pick the first valid one or use the last one?
                // Usually mode or last. Let's pick 'setor' from any alloc.
                const primaryAloc = myAlocs.find(a => a.setor && a.setor !== "AGUARDANDO");
                if (primaryAloc) {
                    sNome = primaryAloc.setor;
                    cNome = primaryAloc.campus || "SEM POSTO";
                }

                return {
                    mat: v.matricula,
                    nome: v.nome,
                    eq: team,
                    campus: cNome,
                    setor: sNome,
                    horario: "07:00 às 19:00",
                    refeicao: "1h",
                    manualLock: false,
                    coberturas: [],
                    dias: myAlocs.map((a) => parseInt(a.data.split("-")[2])).sort((x: number, y: number) => x - y),
                    ferias: [],
                    extras: []
                } as Vigilante;
            });

            return legacyList;
        } catch (err: any) {
            console.error("[CLIENT-ADAPTER] getEscala Error:", err.message);
            return [];
        }
    },

    async saveEscala(monthStr: string, vigilantes: Vigilante[]): Promise<boolean> {
        try {
            const year = parseInt(monthStr.substring(0, 4));
            const monthNum = parseInt(monthStr.substring(4, 6));
            const dateFormat = `${year}-${String(monthNum).padStart(2, "0")}`;

            console.log(`[CLIENT-ADAPTER] Saving ${vigilantes.length} vigilantes...`);

            // --- FASE 1: SINCRONIZAR PERFIS ---
            // Just Upsert to ensure they exist and update 'equipe'
            const vigilantesToSync = vigilantes
                .map((v) => {
                    const cleanMat = String(v.mat || "").trim();
                    return {
                        matricula: cleanMat,
                        nome: v.nome,
                        ativo: true,
                        equipe: v.eq || "A"
                    };
                })
                .filter((v) => v.matricula);

            if (vigilantesToSync.length > 0) {
                // Use onConflict matricula (since it's unique/PK effectively 
                // even if ID is PK, there is constraint)
                const { error: upsertErr } = await supabase
                    .from("vigilantes")
                    .upsert(vigilantesToSync, { onConflict: "matricula" });

                if (upsertErr) console.error("❌ Error syncing profiles:", upsertErr);
            }

            // --- FASE 2: PREPARAR ALOCAÇÕES ---
            // We need to resolve Sector ID? 
            // NO! The DB probe showed 'alocacoes' takes 'setor' (text) and 'campus' (text).
            // It does NOT have 'setor_id'. (Confirmed by User Screenshot & Probe)

            const newAllocations: any[] = [];
            const allVigMatriculas: string[] = [];

            for (const v of vigilantes) {
                const cleanMat = String(v.mat || "").trim();
                if (!cleanMat) continue;

                allVigMatriculas.push(cleanMat);

                if (Array.isArray(v.dias) && v.dias.length > 0) {

                    // Logic: Use Frontend Strings directly
                    const setorVal = v.setor || "AGUARDANDO";
                    const campusVal = v.campus || "SEM POSTO";

                    v.dias.forEach((day: number) => {
                        newAllocations.push({
                            vigilante_id: cleanMat, // TEXT (Confirmed by Step 1006)
                            data: `${dateFormat}-${String(day).padStart(2, "0")}`,
                            setor: setorVal,
                            campus: campusVal
                            // NO 'tipo', NO 'equipe' (missing in DB)
                        });
                    });
                }
            }

            // --- FASE 3: BATCH OPERATIONS ---

            // A) DELETE OLD (by Matricula/Text)
            if (allVigMatriculas.length > 0) {
                await supabase
                    .from("alocacoes")
                    .delete()
                    .in("vigilante_id", allVigMatriculas)
                    .gte("data", `${dateFormat}-01`)
                    .lte("data", `${dateFormat}-31`);
            }

            // B) INSERT NEW
            if (newAllocations.length > 0) {
                const CHUNK_SIZE = 500;
                for (let i = 0; i < newAllocations.length; i += CHUNK_SIZE) {
                    const { error: insErr } = await supabase
                        .from("alocacoes")
                        .insert(newAllocations.slice(i, i + CHUNK_SIZE));
                    if (insErr) console.error("❌ Allocation Insert Error:", insErr);
                }
            }

            return true;
        } catch (e) {
            console.error("[CLIENT-ADAPTER] Save Error", e);
            return false;
        }
    },

    async loadPresets(): Promise<DepartmentPreset[]> {
        try {
            const { data: setores, error } = await supabase.from("setores").select("*");
            if (error) throw error;
            return (setores || []).map((s: any) => {
                let type = "12x36_DIURNO"; let horario = "07:00 às 19:00";
                if (s.turno === "NOTURNO") { type = "12x36_NOTURNO"; horario = "19:00 às 07:00"; }
                else if (s.turno === "ADM") { type = "ADM"; horario = "08:00 às 17:48"; }
                return {
                    id: String(s.id),
                    db_id: s.id,
                    name: s.nome,
                    campus: s.campus,
                    code: s.codigo_radio,
                    sector: s.nome,
                    type,
                    team: s.equipe || "",
                    horario
                } as DepartmentPreset;
            });
        } catch (e) { return []; }
    },
    async savePresets(presets: DepartmentPreset[]): Promise<boolean> { return true; }
};
