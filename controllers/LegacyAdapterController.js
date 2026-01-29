import { createClient } from "@supabase/supabase-js";

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPERS ---
const withTimeout = (promise, ms = 30000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Database Timeout")), ms)
  );
  return Promise.race([promise, timeout]);
};

export const LegacyAdapterController = {
  /**
   * GET /api/vigilantes
   * Retorna a lista de vigilantes no formato LEGADO (db.json antigo)
   * MODIFICADO ERS: Não lê mais `equipe_padrao`. Infere equipe das alocações.
   */
  async getVigilantes(req, res) {
    try {
      // 1. Buscar Vigilantes (Apenas dados pessoais)
      const { data: vigs, error: errV } = await withTimeout(supabase
        .from("vigilantes")
        .select("id, matricula, nome, equipe")
        .order("nome"));
      if (errV) throw errV;

      const { data: setoresData } = await supabase.from("setores").select("*");
      const sectorMap = new Map((setoresData || []).map((s) => [s.id, s]));

      // 2. Determinar o mês atual
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // 3. Buscar Alocações (dias trabalhados)
      const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`;

      const { data: alocs, error: errA } = await supabase
        .from("alocacoes")
        .select("vigilante_id, data, tipo, setor_id")
        .gte("data", startOfMonth)
        .lte("data", endOfMonth);

      if (errA) console.warn("Erro ao buscar alocações:", errA);

      // 4. Buscar Férias
      const { data: feriasList } = await supabase
        .from("ferias")
        .select("*")
        .gte("data_fim", startOfMonth)
        .lte("data_inicio", endOfMonth);

      // 5. Buscar Solicitações (Requests)
      const { data: requestsList } = await supabase
        .from("solicitacoes_folga")
        .select("*");

      // --- MAP ---
      const legacyList = vigs.map((v) => {
        // Filtra alocações deste vigilante
        const myAlocs = (alocs || []).filter((a) => a.vigilante_id === v.id);

        // INFERÊNCIA DE EQUIPE (ERS RULE)
        const teamCounts = {};
        let inferredTeam = "A DEFINIR";

        // INFERÊNCIA DE SETOR
        const sectorCounts = {};
        let inferredSectorId = null;

        myAlocs.forEach((a) => {
          // Contagem Equipe
          if (a.tipo && a.tipo !== "NORMAL" && a.tipo.length <= 10) {
            const t = a.tipo;
            teamCounts[t] = (teamCounts[t] || 0) + 1;
          }

          // Contagem Setor
          if (a.setor_id) {
            sectorCounts[a.setor_id] = (sectorCounts[a.setor_id] || 0) + 1;
          }
        });

        // Achar equipe vencedora
        let maxCount = 0;
        Object.entries(teamCounts).forEach(([team, count]) => {
          if (count > maxCount) {
            maxCount = count;
            inferredTeam = team;
          }
        });

        // Achar setor vencedor
        let maxSecCount = 0;
        Object.entries(sectorCounts).forEach(([sid, count]) => {
          if (count > maxSecCount) {
            maxSecCount = count;
            inferredSectorId = sid;
          }
        });

        // FALLBACK EQUIPE (ERS FIX):
        if (inferredTeam === "A DEFINIR" && v.equipe) {
          inferredTeam = v.equipe;
        }

        // Resolve nome do setor
        let setorNome = "AGUARDANDO";
        let campusNome = "SEM POSTO";
        if (inferredSectorId) {
          const s = sectorMap.get(parseInt(inferredSectorId));
          if (s) {
            setorNome = s.nome;
            campusNome = s.campus;
          }
        }

        // Mapear dias
        const dias = myAlocs
          .map((a) => parseInt(a.data.split("-")[2]))
          .sort((a, b) => a - b);

        // Mapear Férias
        let vacationCompat = undefined;
        const myVacation = (feriasList || []).find(
          (f) => f.vigilante_id === v.id,
        );
        if (myVacation) {
          vacationCompat = {
            start: parseInt(myVacation.data_inicio.split("-")[2]),
            end: parseInt(myVacation.data_fim.split("-")[2]),
          };
        }

        // Mapear Requests
        const myRequests = (requestsList || [])
          .filter((r) => r.vigilante_id === v.id)
          .map((r) => ({
            day: parseInt(r.data.split("-")[2]),
            option: r.opcao,
            timestamp: r.timestamp || 0,
            status: r.status,
          }));

        return {
          mat: v.matricula,
          nome: v.nome,
          eq: inferredTeam, // INFERIDO
          campus: campusNome, // INFERIDO
          setor: setorNome, // INFERIDO
          dias: dias,
          vacation: vacationCompat,
          requests: myRequests.length > 0 ? myRequests : undefined,
          horario: "",
          refeicao: "",
          manualLock: false,
          folgasGeradas: [],
          faltas: [],
          saidasAntecipadas: [],
        };
      });

      res.json(legacyList);
    } catch (error) {
      console.error("LegacyAdapter Ident Error:", error);
      res
        .status(500)
        .json({ error: "Erro interno no adaptador legado (ERS)." });
    }
  },

  /**
   * POST /api/save
   * Salva dias trabalhados.
   */
  async saveSchedule(req, res) {
    try {
      const { mat, dias } = req.body;
      if (!mat || !Array.isArray(dias))
        return res.status(400).json({ error: "Inválido" });

      // 1. Achar vigilante
      const { data: v } = await supabase
        .from("vigilantes")
        .select("id")
        .eq("matricula", mat)
        .single();
      if (!v)
        return res.status(404).json({ error: "Vigilante não encontrado" });

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const startOfMonth = `${year}-${month}-01`;
      const endOfMonth = `${year}-${month}-31`;

      // 2. Descobrir a equipe/setor atuais ANTES de deletar (Snapshot)
      const { data: currentAlocs } = await supabase
        .from("alocacoes")
        .select("tipo, setor_id")
        .eq("vigilante_id", v.id)
        .gte("data", startOfMonth)
        .lte("data", endOfMonth)
        .limit(10); // Amostra

      // Inferir (moda)
      let currentTeam = "A"; // Default fallback
      if (currentAlocs && currentAlocs.length > 0) {
        const t = currentAlocs.find((a) => a.tipo && a.tipo.length < 5)?.tipo;
        if (t) currentTeam = t;
      }

      // Inferir Setor
      let currentSectorId = null;
      if (currentAlocs && currentAlocs.length > 0) {
        const s = currentAlocs.find((a) => a.setor_id)?.setor_id;
        if (s) currentSectorId = s;
      }

      // 3. Delete old
      const { error: errDel } = await supabase
        .from("alocacoes")
        .delete()
        .eq("vigilante_id", v.id)
        .gte("data", startOfMonth)
        .lte("data", endOfMonth);
      if (errDel) throw errDel;

      // 4. Insert new
      if (dias.length > 0) {
        const rows = dias.map((day) => ({
          vigilante_id: v.id,
          data: `${year}-${month}-${String(day).padStart(2, "0")}`,
          setor_id: currentSectorId,
          tipo: currentTeam, // PERSISTE A EQUIPE AQUI
        }));

        const { error: errIns } = await supabase.from("alocacoes").insert(rows);
        if (errIns) throw errIns;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("LegacyAdapter Save Error:", error);
      res.status(500).json({ error: "Erro save" });
    }
  },

  async getEscala(req, res) {
    try {
      const { month } = req.params; // YYYYMM
      const year = parseInt(month.substring(0, 4));
      const monthNum = parseInt(month.substring(4, 6));

      const startOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-${lastDay}`;

      console.log(`[BACKEND] getEscala ${month}`);

      // Performance: Fetch only necessary columns
      const [vigsRes, alocsRes, setoresRes] = await withTimeout(Promise.all([
        supabase.from("vigilantes").select("id, matricula, nome, equipe").order("nome"),
        supabase.from("alocacoes").select("vigilante_id, data, tipo, setor_id").gte("data", startOfMonth).lte("data", endOfMonth),
        supabase.from("setores").select("id, nome, campus")
      ]));

      if (vigsRes.error) throw vigsRes.error;

      const vigs = vigsRes.data || [];
      const alocs = alocsRes.data || [];
      const setores = setoresRes.data || [];

      const sectorMap = new Map(setores.map((s) => [s.id, s]));

      // Pre-group allocations by vigilante for faster lookup
      const alocsByVig = new Map();
      alocs.forEach(a => {
        if (!alocsByVig.has(a.vigilante_id)) alocsByVig.set(a.vigilante_id, []);
        alocsByVig.get(a.vigilante_id).push(a);
      });

      const legacyList = vigs.map((v) => {
        const myAlocs = alocsByVig.get(v.id) || [];

        // 1. Infer Team: Check if any allocation in this month has a team type
        let team = myAlocs.find((a) => a.tipo && a.tipo.length < 10)?.tipo;
        if (!team) team = v.equipe || "A DEFINIR";

        // 2. Infer Sector/Campus
        let sNome = "AGUARDANDO", cNome = "SEM POSTO";
        const primaryAloc = myAlocs.find(a => a.setor_id);

        if (primaryAloc && sectorMap.has(primaryAloc.setor_id)) {
          const s = sectorMap.get(primaryAloc.setor_id);
          sNome = s.nome;
          cNome = s.campus;
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
          dias: myAlocs.map((a) => parseInt(a.data.split("-")[2])).sort((x, y) => x - y),
        };
      });

      res.json({ dados: legacyList });
    } catch (err) {
      console.error("[BACKEND] getEscala Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  },

  async saveEscala(req, res) {
    const { month } = req.params;
    const { dados } = req.body;
    return LegacyAdapterController._processSave(month, dados || req.body, res);
  },

  async _processSave(monthStr, vigilantes, res) {
    try {
      const year = parseInt(monthStr.substring(0, 4));
      const monthNum = parseInt(monthStr.substring(4, 6));
      const dateFormat = `${year}-${String(monthNum).padStart(2, "0")}`;

      // --- FASE 1: SINCRONIZAR PERFIS (Self-Healing) ---
      const { data: currentVigs } = await supabase
        .from("vigilantes")
        .select("id, matricula");
      const currentMap = new Map();
      (currentVigs || []).forEach((v) =>
        currentMap.set(String(v.matricula).trim(), v.id),
      );

      const vigilantesToSync = vigilantes
        .map((v) => {
          const cleanMat = String(v.mat || "").trim();
          const existingId = currentMap.get(cleanMat);
          if (cleanMat === "100961")
            console.log(
              `🔍 WESLEY SYNC: mat=${cleanMat}, eq=${v.eq}, id=${existingId}`,
            );
          const p = {
            matricula: cleanMat,
            nome: v.nome,
            equipe: v.eq || "A",
            ativo: true,
          };
          if (existingId) p.id = existingId;
          return p;
        })
        .filter((v) => v.matricula);

      if (vigilantesToSync.length > 0) {
        // FORCE UPDATE of all columns to ensure 'equipe' changes are applied
        // Passing the columns to 'ignoreDuplicates: false' is default, but we want to ensure
        // that if the row exists, it updates. Supabase upsert does this by default.
        // Let's add more logs to ensure we are reaching here.
        console.log(`⚡ Syncing ${vigilantesToSync.length} profiles...`);
        const { error: upsertErr } = await supabase
          .from("vigilantes")
          .upsert(vigilantesToSync, { onConflict: "matricula" });
        if (upsertErr) console.error("❌ Error syncing profiles:", upsertErr);
        else console.log("✅ Profiles synchronized successfully.");
      }

      // --- FASE 3: MAPEAR IDs FINAIS ---
      const { data: refreshedVigs } = await supabase
        .from("vigilantes")
        .select("id, matricula");
      const vigMap = new Map();
      (refreshedVigs || []).forEach((v) =>
        vigMap.set(String(v.matricula).trim(), v.id),
      );

      const { data: allSectors } = await supabase
        .from("setores")
        .select("id, nome, campus");
      const sectorMap = new Map();
      allSectors.forEach((s) =>
        sectorMap.set(
          `${String(s.nome).trim()}|${String(s.campus).trim()}`,
          s.id,
        ),
      );

      const allVigIds = [];
      const newAllocations = [];

      // --- FASE 3: PREPARAR ALOCAÇÕES ---
      for (const v of vigilantes) {
        const cleanMat = String(v.mat || "").trim();
        const vigId = vigMap.get(cleanMat);
        if (!vigId) continue;

        allVigIds.push(vigId);
        const sectorId =
          sectorMap.get(
            `${String(v.setor).trim()}|${String(v.campus).trim()}`,
          ) || null;

        if (Array.isArray(v.dias) && v.dias.length > 0) {
          v.dias.forEach((day) => {
            newAllocations.push({
              vigilante_id: vigId,
              data: `${dateFormat}-${String(day).padStart(2, "0")}`,
              setor_id: sectorId,
              tipo: v.eq || "A",
            });
          });
        }
      }

      // --- FASE 4: SALVAMENTO MASSIVO ALOCAÇÕES ---
      // A) Limpeza em Bloco
      if (allVigIds.length > 0) {
        await supabase
          .from("alocacoes")
          .delete()
          .in("vigilante_id", allVigIds)
          .gte("data", `${dateFormat}-01`)
          .lte("data", `${dateFormat}-31`);
      }

      // B) Inserção Massiva
      if (newAllocations.length > 0) {
        const CHUNK_SIZE = 500;
        for (let i = 0; i < newAllocations.length; i += CHUNK_SIZE) {
          const { error: insErr } = await supabase
            .from("alocacoes")
            .insert(newAllocations.slice(i, i + CHUNK_SIZE));
          if (insErr)
            console.error("❌ Erro ao inserir lote de alocações:", insErr);
        }
      }

      res.json({ success: true, message: "Sincronização Turbo concluída." });
    } catch (e) {
      console.error("Batch Save Error:", e);
      res.status(500).json({ error: "Falha no processamento turbinado." });
    }
  },

  async importMigration(req, res) {
    try {
      const { vigilantes } = req.body;
      if (!vigilantes || !Array.isArray(vigilantes))
        return res.status(400).json({ error: "Dados invalidos" });

      console.log("Iniciando Migração ERS...");
      const TARGET_MONTH = "2026-01";

      const { data: sDb } = await supabase.from("setores").select("*");
      const sectorMap = new Map(
        sDb.map((s) => [`${s.nome}|${s.campus}`, s.id]),
      );

      for (const v of vigilantes) {
        const { data: vData } = await supabase
          .from("vigilantes")
          .upsert(
            { matricula: v.mat, nome: v.nome },
            { onConflict: "matricula" },
          )
          .select("id")
          .single();

        if (!vData) continue;

        const sId = sectorMap.get(`${v.setor}|${v.campus}`);
        const startM = `${TARGET_MONTH}-01`;
        const endM = `${TARGET_MONTH}-31`;

        await supabase
          .from("alocacoes")
          .delete()
          .eq("vigilante_id", vData.id)
          .gte("data", startM)
          .lte("data", endM);

        if (v.dias && v.dias.length > 0) {
          const rows = v.dias.map((d) => ({
            vigilante_id: vData.id,
            data: `${TARGET_MONTH}-${String(d).padStart(2, "0")}`,
            setor_id: sId,
            tipo: v.eq || "A",
          }));

          await supabase
            .from("alocacoes")
            .upsert(rows, { onConflict: "vigilante_id, data" });
        }
      }

      res.json({ success: true, message: "Migração ERS Concluída" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro migracao" });
    }
  },

  async importFromUrl(req, res) {
    res.status(501).json({ error: "Not implemented in this version" });
  },
  async importFromLegacyDb(req, res) {
    res.status(501).json({ error: "Not implemented in this version" });
  },

  /**
   * Gera Presets dinamicamente a partir da tabela 'setores' (ERS Compliant).
   */
  async getDynamicPresets(req, res) {
    try {
      if (res) res.setHeader("Cache-Control", "no-store");
      const { data: setores, error } = await supabase
        .from("setores")
        .select("*");
      if (error) throw error;

      const presets = setores.map((s) => {
        // ID Único e Estável vindo da chave primária do DB (Fundamental para RC11)
        const id = String(s.id);

        let cleanCampus = (s.campus || "SEM_CAMPUS").toUpperCase();
        let cleanSetor = (s.nome || "SEM_NOME").toUpperCase();

        // Mapeamento Direto do Banco (ERS Compliant)
        let team = s.equipe || "";
        if (!team) {
          if (cleanCampus.includes("ECO 1") || cleanCampus.includes("ECO1"))
            team = "ECO 1";
          else if (
            cleanCampus.includes("ECO 2") ||
            cleanCampus.includes("ECO2")
          )
            team = "ECO 2";
          else if (cleanSetor.includes("NOTURNO") || cleanSetor.includes("19H"))
            team = "B";
        }

        let type = "12x36_DIURNO";
        let horario = "07:00 às 19:00";

        if (s.turno) {
          if (s.turno === "DIURNO") {
            type = "12x36_DIURNO";
            horario = "07:00 às 19:00";
          } else if (s.turno === "NOTURNO") {
            type = "12x36_NOTURNO";
            horario = "19:00 às 07:00";
          } else if (s.turno === "ADM") {
            type = "ADM";
            horario = "08:00 às 17:48";
          } else {
            type = s.turno;
          }
        } else {
          if (cleanSetor.includes("NOTURNO") || cleanSetor.includes("19H")) {
            type = "12x36_NOTURNO";
            horario = "19:00 às 07:00";
          }
          if (cleanCampus.includes("EXPEDIENTE")) {
            type = "EXPEDIENTE";
            horario = "08:00 às 17:48";
          }
        }

        return {
          id,
          db_id: s.id, // REAL DB ID for Updates
          name: s.nome,
          address: s.codigo_radio,
          code: s.codigo_radio,
          campus: s.campus,
          sector: s.nome,
          type,
          team,
          horario: horario,
          refeicao: "1h",
          timeStart: horario.split(" ")[0] || "07:00",
          timeEnd: horario.split(" ")[2] || "19:00",
          mealStart: "12:00",
          mealEnd: "13:00",
        };
      });

      if (res) return res.json(presets);
      return presets;
    } catch (err) {
      console.error("Dynamic Presets Error:", err);
      if (res)
        res.status(500).json({ error: "Erro ao gerar presets dinâmicos" });
      return [];
    }
  },

  /**
   * POST /api/presets
   * Salva alterações nos postos de serviço diretamente no Supabase.
   * AGORA: Sincroniza (Upsert + Delete) e retorna a lista atualizada.
   */
  async savePresets(req, res) {
    try {
      let data = req.body;
      const isArray = Array.isArray(data);
      const items = isArray ? data : [data];

      console.log(
        `[PERSISTÊNCIA] Recebida tentativa de salvar ${items.length} item(s).`,
      );

      for (const p of items) {
        const payload = {
          nome: (p.name || p.sector || "A DEFINIR").trim().toUpperCase(),
          campus: (p.campus || "CAMPUS I").trim().toUpperCase(),
          codigo_radio: p.code ? p.code.trim().toUpperCase() : null,
          equipe: p.team || null,
          turno: p.type || "12x36_DIURNO",
        };

        console.log(
          `[DIAGNÓSTICO] Payload para salvar:`,
          JSON.stringify(payload),
        );

        if (p.db_id) {
          const targetId = Number(p.db_id);
          console.log(
            `[PERSISTÊNCIA] Atualizando ID: ${targetId} (${payload.nome}) com ADMIN KEY`,
          );
          const { error: updateError, count } = await supabase
            .from("setores")
            .update(payload, { count: "exact" })
            .eq("id", targetId);

          if (updateError) throw updateError;
          if (count === 0) {
            console.error(
              `[ERRO] Nenhuma linha encontrada para o ID ${targetId}`,
            );
            throw new Error(
              `O posto ID ${targetId} não foi encontrado no banco para atualização.`,
            );
          }
          console.log(`[PERSISTÊNCIA] Sucesso: 1 linha atualizada.`);
        } else {
          console.log(
            `[PERSISTÊNCIA] Inserindo novo posto com ADMIN KEY: ${payload.nome}`,
          );
          const { error: insertError } = await supabase
            .from("setores")
            .insert(payload);

          if (insertError) throw insertError;
        }
      }

      console.log(`[PERSISTÊNCIA] Sucesso. Recarregando lista...`);
      return await LegacyAdapterController.getDynamicPresets(req, res);
    } catch (e) {
      console.error("!!!! ERRO FATAL AO SALVAR POSTO !!!!", e);
      res.status(500).json({
        error: "Erro ao persistir no banco de dados.",
        details: e.message,
      });
    }
  },
};
