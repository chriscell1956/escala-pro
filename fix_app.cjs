
const fs = require('fs');
const path = require('path');

const appPath = path.resolve('App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// The error "App.tsx:5962:1 - error TS1005: '}' expected" and "App.tsx:1479:38"
// indicates that lancadorList is lacking a '}' at its end OR is nested.

// Let's do a more surgical replacement.
const lines = content.split('\n');

// 1. Find start of lancadorList
const startIdx = lines.findIndex(l => l.includes('const lancadorList = useMemo(() => {'));

// 2. Find end of lancadorList (the one with presets dependency)
let endIdx = -1;
if (startIdx !== -1) {
  for (let i = startIdx + 5; i < lines.length; i++) {
    if (lines[i].includes('presets,') && lines[i + 1]?.includes(']);')) {
      endIdx = i + 1;
      break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const newLancadorList = `
    const lancadorList = useMemo(() => {
      // --- DIAGNOSTICS: LANÇADOR LIST ---
      const isLMaster = user?.perfil === "MASTER";
      console.log("DIAGNOSTICO: lancadorList iniciada. Data count:", data.length, "isMaster:", isLMaster, "SelectedTeam:", selectedLancadorTeam);

      let filtered = data.filter((v) => v.campus !== "AFASTADOS");
      console.log("DIAGNOSTICO: Após remover AFASTADOS:", filtered.length);

      // Regra Fiscal: Vê apenas sua própria equipe no Lançador
      if (user?.perfil === "FISCAL" && !isLMaster) {
        const fiscalVig = currentUserVig;
        const visibleTeamsRes = getLancadorVisibleTeams(
          fiscalVig?.eq || "A",
          false,
          user?.permissions,
          fiscalVig?.horario,
        ).map((t) => cleanString(t));

        console.log("DIAGNOSTICO: Perfil FISCAL. Equipes visíveis:", visibleTeamsRes);

        filtered = filtered.filter((v) => {
          const vEq = cleanString(v.eq);
          return visibleTeamsRes.includes(vEq);
        });
        console.log("DIAGNOSTICO: Após filtro de equipe Fiscal:", filtered.length);
      }

      // DEBUG: FORCE SHOW ALL FOR MASTER TO DIAGNOSE EMPTY LIST
      if (isLMaster) {
        console.log("DEBUG: Master bypass active. Ignorando filtros normais.");
        const bypassTeamFilter = isMaster && lancadorSearch.trim().length > 0;
        if (selectedLancadorTeam !== "TODAS" && !bypassTeamFilter) {
          const bef = filtered.length;
          filtered = filtered.filter(
            (v) => cleanString(v.eq) === cleanString(selectedLancadorTeam)
          );
          console.log(\`DEBUG: Filtered by team \${selectedLancadorTeam}: \${bef} -> \${filtered.length}\`);
        }
        return filtered.sort((a, b) => a.nome.localeCompare(b.nome));
      }

      const bypassTeamFilter = isMaster && lancadorSearch.trim().length > 0;
      if (selectedLancadorTeam !== "TODAS" && !bypassTeamFilter) {
        filtered = filtered.filter(
          (v) => cleanString(v.eq) === cleanString(selectedLancadorTeam),
        );
        console.log("DIAGNOSTICO: Após filtro de equipe selecionada:", filtered.length);
      }

      if (lancadorSearch) {
        const search = cleanString(lancadorSearch);
        filtered = filtered.filter(
          (v) =>
            cleanString(v.nome).includes(search) ||
            cleanString(v.mat).includes(search),
        );
        console.log("DIAGNOSTICO: Após filtro de busca:", filtered.length);
      }

      return filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    }, [
      data,
      selectedLancadorTeam,
      lancadorSearch,
      user,
      currentUserVig,
      isMaster,
      presets,
    ]);`;

  const resultLines = [
    ...lines.slice(0, startIdx),
    newLancadorList,
    ...lines.slice(endIdx + 1)
  ];

  fs.writeFileSync(appPath, resultLines.join('\n'));
  console.log("SUCCESS: Replaced lancadorList.");
} else {
  console.log("FAILURE: Could not identify lancadorList.");
}
