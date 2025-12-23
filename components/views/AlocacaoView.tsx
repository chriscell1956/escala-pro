import React, { useMemo, useState } from "react";
import { Vigilante, DepartmentPreset } from "../../types";
import { cleanString } from "../../utils";
import { Icons, Badge, SearchableSelect } from "../ui";

interface AlocacaoViewProps {
  currentLabel: string;
  vigilantes: Vigilante[];
  presets: DepartmentPreset[];
  expandedSectors: Set<string>;
  toggleSectorExpansion: (sector: string) => void;
  onUpdateVigilante: (mat: string, changes: Partial<Vigilante>) => void;
  lancadorVisibleTeams: string[];
}

// Helper to determine compatible teams based on preset type
const getCompatibleTeams = (presetType?: string): string[] => {
  if (!presetType)
    return ["A", "B", "C", "D", "ECO1", "ECO2", "ECO 1", "ECO 2", "ADM"];
  const type = presetType.toUpperCase();
  // Diurno: C, D, ECO1, ECO2 (Apoio), ADM
  // Note: Added ECO1/ECO2 explicitly to match vigilante data
  // Also added "ECO 1", "ECO 2" with spaces for safety
  if (type.includes("DIURNO") || type.includes("EXPEDIENTE"))
    return ["C", "D", "ECO1", "ECO2", "ECO 1", "ECO 2", "ADM"];
  // Noturno: A, B, ECO1, ECO2
  if (type.includes("NOTURNO"))
    return ["A", "B", "ECO1", "ECO2", "ECO 1", "ECO 2"];
  // Fallback for ADM/Expediente or undefined
  return ["A", "B", "C", "D", "ECO1", "ECO2", "ECO 1", "ECO 2", "ADM"];
};

export const AlocacaoView: React.FC<AlocacaoViewProps> = ({
  currentLabel,
  vigilantes,
  presets,
  expandedSectors,
  toggleSectorExpansion,
  onUpdateVigilante,
  lancadorVisibleTeams,
}) => {
  // 3. Organizar Presets por Campus (Ordem Alfabética)
  // 3. Organizar Presets por Campus (Ordem Alfabética)
  const groupedPresets = useMemo(() => {
    const groups: Record<string, DepartmentPreset[]> = {};

    // Helper para identificar perfil do usuário (Diurno vs Noturno) basico
    const normVisible = lancadorVisibleTeams.map(cleanString);
    const hasDiurno = normVisible.some((t) =>
      ["C", "D", "ADM", "ECO1", "E1"].includes(t),
    );
    const hasNoturno = normVisible.some((t) =>
      ["A", "B", "ECO2", "E2"].includes(t),
    );
    const isMasterOrFull = hasDiurno && hasNoturno;

    presets.forEach((p) => {
      // FILTER: Check Authorization
      // Se não for master/full, aplica filtro estrito
      if (!isMasterOrFull) {
        const type = (p.type || "").toUpperCase();
        const campus = (p.campus || "").toUpperCase();
        const sector = (p.sector || "").toUpperCase();

        const id = (p.id || "").toUpperCase();
        const name = (p.name || "").toUpperCase();

        // Check Type OR Campus OR ID OR Name String (Fallback)
        // Ensure robust check across all properties
        const isDiurnoPreset =
          type.includes("DIURNO") ||
          campus.includes("DIURNO") ||
          id.includes("DIURNO") ||
          name.includes("DIURNO") ||
          sector.includes("DIURNO") ||
          type.includes("EXPEDIENTE") ||
          campus.includes("EXPEDIENTE") ||
          sector.includes("EXPEDIENTE") ||
          name.includes("EXPEDIENTE") ||
          id.includes("EXPEDIENTE");
        const isNoturnoPreset =
          type.includes("NOTURNO") ||
          campus.includes("NOTURNO") ||
          id.includes("NOTURNO") ||
          name.includes("NOTURNO") ||
          sector.includes("NOTURNO");

        // EXCEPTION: "A DEFINIR" should be visible to everyone
        const isADefinir =
          campus.includes("DEFINIR") || sector.includes("DEFINIR");

        // ECO/APOIO Logic
        // If it sends "ECO 1" or "APOIO DIURNO", it should be visible to Diurno
        // If it sends "ECO 2" or "APOIO NOTURNO", it should be visible to Noturno
        const isEco1 =
          sector.includes("ECO 1") ||
          sector.includes("ECO1") ||
          campus.includes("ECO 1") ||
          campus.includes("ECO1") ||
          (sector.includes("APOIO") && isDiurnoPreset);
        const isEco2 =
          sector.includes("ECO 2") ||
          sector.includes("ECO2") ||
          campus.includes("ECO 2") ||
          campus.includes("ECO2") ||
          (sector.includes("APOIO") && isNoturnoPreset);

        if (!isADefinir) {
          let shouldShow = false;

          // Rule: Diurno sees Diurno + ECO1
          if (hasDiurno && (isDiurnoPreset || isEco1)) shouldShow = true;
          // Rule: Noturno sees Noturno + ECO2
          if (hasNoturno && (isNoturnoPreset || isEco2)) shouldShow = true;

          // If not explicitly allowed, return (hide)
          if (!shouldShow) return;
        }
      }

      if (!groups[p.campus]) groups[p.campus] = [];
      groups[p.campus].push(p);
    });
    return groups;
  }, [presets, lancadorVisibleTeams]);

  const campusList = useMemo(
    () => Object.keys(groupedPresets).sort(),
    [groupedPresets],
  );

  // Handler para atribuir vigilante ao slot
  const handleAssign = (preset: DepartmentPreset, mat: string) => {
    onUpdateVigilante(mat, {
      campus: preset.campus,
      setor: preset.sector, // Fixed: usar sector
      horario: preset.horario, // Assume horário do preset
      refeicao: preset.refeicao, // Assume refeição do preset
    });
  };

  // Handler para desatribuir (Limpar slot)
  const handleUnassign = (mat: string) => {
    onUpdateVigilante(mat, {
      campus: "SEM POSTO",
      setor: "AGUARDANDO",
    });
  };

  // Helper para identificar perfil do usuário (Diurno vs Noturno) basico
  const normVisible = lancadorVisibleTeams.map(cleanString);
  const hasDiurno = normVisible.some((t) =>
    ["C", "D", "ADM", "ECO1", "E1"].includes(t),
  );
  const hasNoturno = normVisible.some((t) =>
    ["A", "B", "ECO2", "E2"].includes(t),
  );
  const isMasterOrFull = hasDiurno && hasNoturno;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Header da View */}
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center print:hidden">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Alocação de Postos de Serviço
        </h2>
        <div className="text-xs text-slate-400">
          {currentLabel} • Modo Simplificado
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SEÇÃO A DEFINIR / PENDENTES */}
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
          <div
            onClick={() => toggleSectorExpansion("A DEFINIR")}
            className="bg-orange-950/40 px-4 py-3 border-b border-slate-700 flex justify-between items-center cursor-pointer hover:bg-orange-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-sm text-orange-200">
                ⚠️ A DEFINIR / PENDENTES
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-slate-800 text-slate-400"
              >
                {
                  vigilantes.filter(
                    (v) =>
                      lancadorVisibleTeams.includes(cleanString(v.eq)) &&
                      (!v.campus ||
                        v.campus === "SEM POSTO" ||
                        v.campus.includes("DEFINIR") ||
                        !v.setor ||
                        v.setor === "AGUARDANDO" ||
                        v.setor.includes("DEFINIR")),
                  ).length
                }{" "}
                PENDENTES
              </Badge>
            </div>
            <div className="text-[10px] uppercase font-bold text-orange-500/50">
              {expandedSectors.has("A DEFINIR") ? "Minimizar" : "Expandir"}
            </div>
          </div>

          {expandedSectors.has("A DEFINIR") && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {vigilantes
                .filter(
                  (v) =>
                    lancadorVisibleTeams.includes(cleanString(v.eq)) &&
                    (!v.campus ||
                      v.campus === "SEM POSTO" ||
                      v.campus.includes("DEFINIR") ||
                      !v.setor ||
                      v.setor === "AGUARDANDO" ||
                      v.setor.includes("DEFINIR")),
                )
                .map((v) => (
                  <div
                    key={v.mat}
                    className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-700"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-200">
                        {v.nome}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {v.mat} • Eq {v.eq}
                      </span>
                    </div>
                    <div className="text-[10px] text-orange-500 font-bold">
                      SEM POSTO
                    </div>
                  </div>
                ))}
              {vigilantes.filter(
                (v) =>
                  lancadorVisibleTeams.includes(cleanString(v.eq)) &&
                  (!v.campus || v.campus === "SEM POSTO"),
              ).length === 0 && (
                <div className="col-span-full text-center text-xs text-slate-500 py-4">
                  Nenhum vigilante pendente.
                </div>
              )}
            </div>
          )}
        </div>

        {campusList.map((campus) => {
          const isExpanded = expandedSectors.has(campus);
          const presetsInCampus = groupedPresets[campus];

          // Helper para distribuir vigilantes sem duplicar visualmente
          const displayedVigilantes = new Set<string>();

          return (
            <div
              key={campus}
              className={`bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden transition-all ${!isExpanded ? "opacity-75 hover:opacity-100" : ""}`}
            >
              {/* Header do Campus (Colapsável) */}
              <div
                onClick={() => toggleSectorExpansion(campus)}
                className="bg-slate-950 px-4 py-3 border-b border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors"
                title={
                  isExpanded ? "Clique para minimizar" : "Clique para expandir"
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                  <span className="font-bold text-sm text-white">{campus}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-slate-800 text-slate-400"
                  >
                    {presetsInCampus.length} POSTOS
                  </Badge>
                </div>

                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                  {isExpanded ? "Minimizar" : "Expandir"}
                  <span className="text-lg leading-none">
                    {isExpanded ? "−" : "+"}
                  </span>
                </div>
              </div>

              {/* Corpo do Campus (Slots) */}
              {isExpanded && (
                <div className="divide-y divide-slate-700/50">
                  {presetsInCampus
                    .sort((a, b) =>
                      (a.sector || "").localeCompare(b.sector || ""),
                    )
                    .map((preset, idx) => {
                      // Quem está neste posto?
                      const allOccupants = vigilantes.filter(
                        (v) =>
                          v.campus === preset.campus &&
                          v.setor === preset.sector,
                      );

                      // Filtrar ocupantes já mostrados para evitar duplicação visual
                      // Se houver multi-preset para o mesmo setor, distribuímos um por slot
                      const availableOccupant = allOccupants.find(
                        (v) => !displayedVigilantes.has(v.mat),
                      );

                      if (availableOccupant) {
                        displayedVigilantes.add(availableOccupant.mat);
                      }

                      // Se não tiver ocupante disponível (mas existirem na lista geral),
                      // significa que todos estão alocados visualmente em outros slots idênticos.
                      // Se for o ÚLTIMO slot deste setor, talvez devêssemos mostrar o resto?
                      // Por enquanto, seguimos estrito 1-por-slot.

                      const isOccupied = !!availableOccupant;
                      const occupants = availableOccupant
                        ? [availableOccupant]
                        : [];

                      // Filter Compatible Vigilantes based on Preset Type (Diurno/Noturno)
                      // AND Visible Teams (Fiscal Permission)
                      const compatibleTeams = getCompatibleTeams(preset.type);

                      const filteredOptions = vigilantes
                        .filter((v) => {
                          const vTeam = cleanString(v.eq).replace(/\s+/g, "");
                          const allowedTeams = lancadorVisibleTeams.map((t) =>
                            cleanString(t).replace(/\s+/g, ""),
                          );
                          const shiftTeams = compatibleTeams.map((t) =>
                            cleanString(t).replace(/\s+/g, ""),
                          );
                          const isNotAlreadyHere = !(
                            v.campus === preset.campus &&
                            v.setor === preset.sector
                          );

                          if (!allowedTeams.includes(vTeam)) return false;
                          if (!shiftTeams.includes(vTeam)) return false;
                          if (!isNotAlreadyHere) return false;

                          return true;
                        })
                        .sort((a, b) =>
                          (a.nome || "").localeCompare(b.nome || ""),
                        )
                        .map((v) => ({
                          value: v.mat,
                          label: v.nome,
                          subLabel: `${v.eq} - ${v.mat}`,
                        }));

                      return (
                        <div
                          key={`${preset.id}-${idx}`}
                          className="p-3 hover:bg-slate-700/30 transition-colors flex items-center gap-4"
                        >
                          {/* Informações do Posto (Esquerda) */}
                          <div className="w-1/3 min-w-[200px]">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-slate-100">
                                {preset.name}
                              </span>
                              <span className="text-xs text-slate-500 italic">
                                {preset.sector}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Badge className="text-[10px] bg-slate-700 text-slate-400 border-none">
                                {preset.timeStart
                                  ? `${preset.timeStart.substring(0, 5)} - ${preset.timeEnd.substring(0, 5)}`
                                  : "12x36"}
                              </Badge>
                              <Badge className="text-[10px] bg-slate-700 text-slate-400 border-none">
                                {preset.type && preset.type.includes("DIURNO")
                                  ? "☀️ DIURNO"
                                  : preset.type &&
                                      preset.type.includes("NOTURNO")
                                    ? "🌑 NOTURNO"
                                    : "ADM"}
                              </Badge>
                            </div>
                          </div>

                          {/* Slot de Alocação (Direita) */}
                          <div className="flex-1 flex flex-col gap-2">
                            {isOccupied ? (
                              occupants.map((occ) => (
                                <div
                                  key={occ.mat}
                                  className="flex items-center justify-between bg-slate-800 border border-slate-600 rounded p-2 shadow-sm animate-fade-in"
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge team={occ.eq} />
                                    <div>
                                      <div className="font-bold text-sm text-white">
                                        {occ.nome}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {occ.mat}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleUnassign(occ.mat)}
                                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                      title="Remover do Posto"
                                    >
                                      <Icons.X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded p-2 flex items-center justify-between group hover:border-slate-500 transition-colors">
                                <span className="text-xs text-slate-500 italic pl-2">
                                  Posto Vago
                                </span>
                                <div className="w-64">
                                  <SearchableSelect
                                    options={filteredOptions}
                                    value=""
                                    onChange={(val) =>
                                      handleAssign(preset, val)
                                    }
                                    placeholder="+ Adicionar Vigilante"
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

        {campusList.length === 0 && (
          <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="text-lg font-bold text-slate-300">
              Nenhum Preset Encontrado
            </h3>
            <p className="text-sm mt-2">
              Cadastre os postos no Gerenciador de Presets para usar a alocação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
