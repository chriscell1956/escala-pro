import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";

// CONFIG
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const FILE_PATH = "./production_db.json";
const TARGET_MONTH = "2026-01"; // TODO: Confirm month/year with user or infer

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
  try {
    console.log(`📖 Lendo arquivo ${FILE_PATH}...`);
    const raw = await readFile(FILE_PATH, "utf-8");
    const db = JSON.parse(raw);

    const vigilantes = db.vigilantes || [];
    console.log(`🔍 Encontrados ${vigilantes.length} vigilantes.`);

    // 1. IMPORTAR SETORES (Deduplicar)
    const allSectors = new Set();
    vigilantes.forEach((v) => {
      if (v.setor && v.setor !== "AGUARDANDO" && v.setor !== "A DEFINIR") {
        allSectors.add(
          JSON.stringify({ nome: v.setor, campus: v.campus || "S/ CAMPUS" }),
        );
      }
    });

    console.log(`🏢 Processando ${allSectors.size} setores únicos...`);
    const setorMap = new Map(); // Nome -> ID

    for (const sJson of allSectors) {
      const { nome, campus } = JSON.parse(sJson);
      // Upsert Setor
      const { data, error } = await supabase
        .from("setores")
        .upsert({ nome, campus }, { onConflict: "nome,campus" }) // Requer constraint unique
        .select("id, nome")
        .single();

      if (!error && data) {
        setorMap.set(nome, data.id);
      } else {
        console.warn(`⚠️ Erro ao criar setor ${nome}:`, error?.message);
      }
    }

    // 2. IMPORTAR VIGILANTES E ALOCAÇÕES
    console.log("👮 Importando vigilantes e escalas...");

    for (const v of vigilantes) {
      // A. Upsert Vigilante
      const setorId = setorMap.get(v.setor) || null;

      const { data: vigData, error: vigErr } = await supabase
        .from("vigilantes")
        .upsert(
          {
            matricula: v.mat,
            nome: v.nome,
            equipe_padrao: v.eq,
            setor_id_padrao: setorId,
          },
          { onConflict: "matricula" },
        )
        .select("id")
        .single();

      if (vigErr || !vigData) {
        console.error(
          `❌ Erro ao importar vigilante ${v.nome}:`,
          vigErr?.message,
        );
        continue;
      }

      // B. Importar Dias (Alocações)
      if (Array.isArray(v.dias) && v.dias.length > 0) {
        const rows = v.dias.map((day) => ({
          vigilante_id: vigData.id,
          data: `${TARGET_MONTH}-${String(day).padStart(2, "0")}`,
          setor_id: setorId, // Assume setor padrão para os dias, ou null
          tipo: "NORMAL",
        }));

        // Limpar prévios para evitar duplicidade no insert simples?
        // Melhor usar upsert ou delete+insert.
        // Como unique é (vigilante_id, data), upsert funciona bem.
        const { error: alocErr } = await supabase
          .from("alocacoes")
          .upsert(rows, { onConflict: "vigilante_id, data" });

        if (alocErr)
          console.warn(
            `   ⚠️ Erro nas alocações de ${v.nome}:`,
            alocErr.message,
          );
      }
    }

    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro fatal na migração:", error);
  }
}

migrate();
