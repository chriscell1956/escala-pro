import React from "react";
import { Vigilante, User, Conflict, DepartmentPreset } from "../../types";
import { getDaysInMonth } from "../../utils";
import { Icons, Badge } from "../ui";

interface EscalaViewProps {
  groupedData: Record<string, Vigilante[]>;
  conflicts: Conflict[];
  user: User | null;
  isUser: boolean;
  isFiscal: boolean;
  isMaster: boolean;
  currentUserVig?: Vigilante;
  currentLabel: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterEq: string;
  setFilterEq: (v: string) => void;
  filterDay: string;
  handleOpenCoverage: (dia: number, campus: string, equipe: string) => void;
  handleReturnFromAway: (vig: Vigilante) => void;
  handleRemoveCoverage: (vig: Vigilante, dia: number) => void;
  visibleTeams: string[];
  expandedSectors: Set<string>;
  toggleSectorCollapse: (sector: string) => void;
  month?: number;
  presets?: DepartmentPreset[]; // Optional to avoid breaking
}

const EscalaViewComponent: React.FC<EscalaViewProps> = (props) => {
  const {
    groupedData,
    conflicts,
    user,
    isUser,
    isFiscal,
    isMaster,
    currentUserVig,
    currentLabel,
    searchTerm,
    setSearchTerm,
    filterEq,
    setFilterEq,
    handleOpenCoverage,
    handleReturnFromAway,
    handleRemoveCoverage,
    expandedSectors,
    toggleSectorCollapse,

    presets = [],
    visibleTeams = [], // FIX: Destructure visibleTeams (default to empty array)
    month,
  } = props;

  const safePresets = Array.isArray(presets) ? presets : [];

  return (
    <div className="h-full flex flex-col">
      {!isUser && (
        <div className="p-2 bg-slate-900 border-b border-slate-700 flex gap-2 print:hidden items-center sticky top-0 z-10">
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 px-3 py-1.5 w-fit shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <div className="text-slate-400 mr-2">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Pesquisar..."
              className="bg-slate-800 border-none text-sm w-32 md:w-48 focus:outline-none placeholder:text-slate-500 font-bold text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="w-px h-5 bg-slate-600 mx-2"></div>
            <select
              value={filterEq}
              onChange={(e) => setFilterEq(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-slate-300 focus:outline-none cursor-pointer hover:text-white"
            >
              <option value="TODAS">Todas Equipes</option>
              {visibleTeams.map((t) => (
                <option key={t} value={t}>
                  Equipe {t}
                </option>
              ))}
              <option value="AFASTADOS">✈️ Afastados</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 print:overflow-visible print:h-auto">
        {isUser && (
          <div className="mb-6 bg-slate-800 border-l-4 border-blue-500 shadow-sm rounded-r-xl p-4">
            <h2 className="text-lg font-bold text-white">
              Olá, {user?.nome.split(" ")[0]}
            </h2>
            <p className="text-sm text-slate-400 mb-3">
              Aqui está o resumo da sua escala para {currentLabel}.
            </p>
            {currentUserVig?.folgasGeradas?.length ? (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 inline-block">
                <div className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">
                  📅 SUAS FOLGAS EXTRAS NESTE MÊS
                </div>
                <div className="text-lg font-black text-red-600">
                  Dias: {currentUserVig.folgasGeradas.join(", ")}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                Nenhuma folga extra definida para este mês.
              </div>
            )}
            {currentUserVig?.status === "RECUPERADO" && (
              <div className="mt-2 bg-blue-50 text-blue-800 text-xs p-2 rounded border border-blue-200">
                ℹ️ <b>Nota:</b> Exibindo escala base (Offline/Backup).
                Conecte-se para ver atualizações recentes.
              </div>
            )}
          </div>
        )}

        {Object.keys(groupedData).length === 0 && isUser && !currentUserVig && (
          <div className="p-8 text-center text-slate-500 bg-slate-800 rounded-lg border border-dashed border-slate-600">
            <p>
              Sua escala para este mês ainda não foi encontrada ou publicada.
            </p>
          </div>
        )}

        {Object.keys(groupedData)
          .sort()
          .map((campus) => {
            const isExpanded = expandedSectors.has(campus);
            let currentConflictsForCampus = conflicts.filter(
              (c) => c.campus === campus,
            );
            if (user?.perfil === "FISCAL" && currentUserVig) {
              currentConflictsForCampus = currentConflictsForCampus.filter(
                (c) => c.equipe === currentUserVig.eq,
              );
            }

            return (
              <div
                key={campus}
                className={`mb-6 bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden break-inside-avoid print:shadow-none print:border-none print:mb-4 transition-all ${!isExpanded ? "opacity-75 hover:opacity-100" : ""}`}
              >
                <div
                  onClick={() => toggleSectorCollapse(campus)}
                  className="w-full bg-slate-950/80 px-4 py-3 border-b border-slate-700 flex items-center gap-3 sticky top-0 z-20 backdrop-blur-sm print:bg-white print:border-black cursor-pointer hover:bg-slate-900/80 transition-colors select-none"
                >
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] print:bg-black"></div>
                  <h3 className="font-bold text-lg text-white print:text-black tracking-tight">
                    {campus === "OUTROS" ? "RETORNO DE FÉRIAS" : campus}
                  </h3>
                  <div className="ml-auto p-1 rounded-full transition-colors">
                    <div
                      className={`transform transition-transform duration-200 ${!isExpanded ? "rotate-0" : "rotate-180"
                        }`}
                    >
                      <span className="text-slate-400 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <>
                    {/* CONFLICTS BANNER */}
                    {currentConflictsForCampus.length > 0 &&
                      (isFiscal || isMaster) && (
                        <div className="bg-red-50/5 border-b border-red-500/20 p-4 print:hidden animate-fade-in relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg bg-red-500/20 w-8 h-8 flex items-center justify-center rounded-full text-red-500">
                              ⚠️
                            </span>
                            <span className="font-bold text-sm text-red-400 uppercase tracking-widest">
                              Alerta de Efetivo Baixo (Regra 50%)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-10">
                            {currentConflictsForCampus.map((c, idx) => (
                              <div
                                key={idx}
                                className="bg-red-950/40 border border-red-500/30 rounded px-3 py-2 flex items-center gap-3 shadow-sm hover:bg-red-900/50 transition-colors"
                              >
                                <div className="flex flex-col items-center leading-none border-r border-red-500/30 pr-3">
                                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
                                    Dia
                                  </span>
                                  <span className="text-xl font-black text-red-500">
                                    {c.dia}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-red-300 font-bold">
                                      Equipe
                                    </span>
                                    <Badge team={c.equipe} />
                                  </div>
                                  <span className="text-[10px] text-red-400 mt-0.5">
                                    {c.msg}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleOpenCoverage(
                                      c.dia,
                                      c.campus,
                                      c.equipe,
                                    )
                                  }
                                  className="ml-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wide shadow-sm transition-all active:scale-95"
                                >
                                  Resolver
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* GRID VIEW */}
                    <div className="overflow-x-auto print:block print:overflow-visible pb-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-700 print:bg-gray-200 print:text-black">
                          <tr>
                            <th className="px-4 py-3 sticky left-0 z-20 bg-slate-900 print:bg-white w-64 min-w-[200px]">NOME / MAT</th>
                            <th className="px-2 py-3 w-16 text-center border-r border-slate-700/50">EQ</th>

                            {/* DYNAMIC DAYS HEADER */}
                            {(() => {
                              try {
                                const numDays = getDaysInMonth(month || 202601);
                                if (isNaN(numDays) || numDays < 28 || numDays > 31) {
                                  console.warn("Invalid numDays in EscalaView:", numDays, "for month:", month);
                                  return null;
                                }
                                return Array.from({ length: numDays }, (_, i) => i + 1).map((d) => (
                                  <th key={d} className="px-0.5 py-3 w-8 text-center min-w-[30px] border-r border-slate-800 font-mono text-slate-500">
                                    {d}
                                  </th>
                                ));
                              } catch (e) {
                                console.error("Error generating days header:", e);
                                return null;
                              }
                            })()}

                            <th className="px-4 py-3 text-right sticky right-0 bg-slate-900 print:bg-white z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">HORÁRIO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {(() => {
                            const list = (groupedData[campus] || []) as (Vigilante & {
                              displayStatus?: {
                                active: boolean;
                                status: string;
                                variant: string;
                              };
                            })[];

                            if (list.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={35} className="px-4 py-8 text-center text-slate-500 italic">
                                    Nenhum vigilante encontrado neste grupo.
                                  </td>
                                </tr>
                              );
                            }

                            return [...list]
                              .sort((a, b) => {
                                try {
                                  // safety check
                                  if (!a || !b) return 0;

                                  // 1. Sort by Sector (Name of Post)
                                  const sA = String(a.setor || "").toUpperCase();
                                  const sB = String(b.setor || "").toUpperCase();
                                  if (sA !== sB) return sA.localeCompare(sB);

                                  // 2. Sort by Horario (Time)
                                  const hA = String(a.horario || "").replace("h", ":");
                                  const hB = String(b.horario || "").replace("h", ":");
                                  if (hA !== hB) return hA.localeCompare(hB);

                                  // 3. Sort by Name (Tie-breaker)
                                  return String(a.nome || "").localeCompare(String(b.nome || ""));
                                } catch (e) {
                                  console.error("Sorting error in EscalaView:", e, a, b);
                                  return 0;
                                }
                              })
                              .map((vig) => {
                                const isAfastado = vig.campus === "AFASTADOS";
                                // Determine days
                                const numDaysRaw = getDaysInMonth(month || 202601);
                                const numDays = (isNaN(numDaysRaw) || numDaysRaw < 28) ? 30 : numDaysRaw;
                                const daysArray = Array.from({ length: numDays }, (_, i) => i + 1);

                                if (!vig || !vig.mat) {
                                  console.warn("Vigilante missing MAT or is null in EscalaView inside group:", campus, vig);
                                  return null;
                                }

                                return (
                                  <tr
                                    key={vig.mat}
                                    className={`${isAfastado ? "bg-amber-900/10" : "even:bg-slate-800/30 odd:bg-transparent hover:bg-slate-700/30"} border-b border-slate-700/50 text-xs print:bg-white print:border-black transition-colors group`}
                                  >
                                    {/* NAME COLUMN */}
                                    <td className="px-4 py-2 align-middle sticky left-0 z-10 bg-inherit backdrop-blur-sm group-hover:bg-slate-800 transition-colors border-r border-slate-700/50">
                                      <div className="flex flex-col">
                                        {(() => {
                                          const preset = safePresets.find(
                                            (p) =>
                                              (p.sector || "").toLowerCase() === (vig.setor || "").toLowerCase() &&
                                              (p.campus || "").toLowerCase() === (vig.campus || "").toLowerCase(),
                                          );
                                          const code = preset?.code;
                                          return (
                                            <>
                                              <span className="font-bold text-slate-200 group-hover:text-white transition-colors truncate max-w-[180px]" title={vig.setor}>
                                                {code ? code : vig.setor}
                                              </span>
                                              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5 truncate max-w-[180px]">
                                                {vig.nome}
                                              </span>
                                            </>
                                          );
                                        })()}
                                      </div>
                                      <div className="text-[9px] text-slate-600 font-mono mt-0.5">{vig.mat}</div>
                                    </td>

                                    {/* TEAM COLUMN */}
                                    <td className="px-2 py-2 text-center align-middle border-r border-slate-700/50">
                                      <Badge team={vig.eq} />
                                    </td>

                                    {/* GRID DAYS COLUMNS */}
                                    {daysArray.map(d => {
                                      const isWork = (vig.dias || []).includes(d);
                                      const isVacation = vig.vacation && d >= vig.vacation.start && d <= vig.vacation.end;
                                      const isFalta = (vig.faltas || []).includes(d);
                                      const isPartial = (vig.saidasAntecipadas || []).includes(d);
                                      const isGeneratedOff = (vig.folgasGeradas || []).includes(d);

                                      let cellClass = "bg-transparent"; // Default empty
                                      let content = "";

                                      if (isVacation) {
                                        cellClass = "bg-amber-500/20 border-b-2 border-amber-500";
                                        content = "F";
                                      } else if (isFalta) {
                                        cellClass = "bg-red-600/20 border-b-2 border-red-600";
                                        content = "X";
                                      } else if (isWork) {
                                        // Check conflicts?
                                        if (isPartial) {
                                          cellClass = "bg-orange-500/30 border-b-2 border-orange-500";
                                          content = "P";
                                        } else {
                                          cellClass = "bg-blue-600/30 border-b-2 border-blue-500";
                                          content = "•";
                                        }
                                      } else if (isGeneratedOff) {
                                        cellClass = "bg-slate-700/30"; // Just visual dimmer
                                      }

                                      return (
                                        <td key={d} className={`p-0 text-center align-middle border-r border-slate-800/50 h-10 w-8 min-w-[30px] relative ${cellClass}`}>
                                          <span className={`text-[10px] font-bold ${isVacation ? 'text-amber-500' : isFalta ? 'text-red-500' : isWork ? 'text-blue-400' : 'text-slate-700'}`}>
                                            {content}
                                          </span>
                                        </td>
                                      )
                                    })}

                                    {/* HORARIO COLUMN */}
                                    <td className="px-4 py-2 text-right align-middle sticky right-0 bg-inherit z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] print:shadow-none border-l border-slate-700/50">
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-slate-300 font-bold text-xs">
                                          {vig.horario}
                                        </span>
                                        {vig.refeicao && vig.refeicao !== "Sem Ref." && (
                                          <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap">
                                            R: {vig.refeicao}
                                          </span>
                                        )}

                                        {/* Action Buttons for Afastados maintained for operations */}
                                        {isAfastado && (
                                          <button
                                            onClick={() => handleReturnFromAway(vig)}
                                            className="mt-1 flex items-center gap-1 bg-slate-700 hover:bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded transition-all shadow-sm"
                                          >
                                            <Icons.History className="w-2.5 h-2.5" /> Retornar
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

EscalaViewComponent.displayName = "EscalaView";

export const EscalaView = React.memo(EscalaViewComponent);
