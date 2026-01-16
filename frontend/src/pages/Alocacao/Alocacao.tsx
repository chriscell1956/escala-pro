import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAlocacao } from "../../hooks/useAlocacao";
import { AlocacaoView } from "../../components/AlocacaoView";
import { DepartmentPreset, Vigilante, VisibilityPermission } from "../../types";
import { FIXED_SECTORS } from "../../constants_sectors";
import { cleanString } from "../../utils";

const Alocacao: React.FC = () => {
    console.log("Alocacao Page: Mounting...");
    const { id } = useParams<{ id: string }>();
    console.log("Alocacao Page: ID Params:", id);

    const [yearStr, monthStr] = (id || "").split("-");
    // Prevent TS unused error
    if (!yearStr || !monthStr) console.log("Parsing ID:", id);
    const selectedYear = parseInt(yearStr) || 2026;
    const selectedMonth = parseInt(monthStr) || 1;
    const currentMonthNum = selectedYear * 100 + selectedMonth;
    const currentLabel = `${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`;

    console.log("Alocacao Page: Calling useAlocacao with", 0, selectedYear, selectedMonth);

    const {
        vigilantes,
        loading,
        alocarVigilante,
        removeAlocacao,
        error
    } = useAlocacao(0, selectedYear, selectedMonth);

    console.log("Alocacao Page: Hook State:", { loading, error, vigilantesCount: vigilantes?.length });

    const [expandedSectors, setExpandedSectors] = useState<Set<string>>(
        new Set(["A DEFINIR", "CAMPUS I", "CAMPUS II", "CAMPUS III"])
    );

    // MOCK Permissions for now (Local Dev mode)
    const isMaster = true;
    const userPermissions: VisibilityPermission[] = [];
    const lancadorVisibleTeams = ["A", "B", "C", "D", "ECO1", "ECO2", "ADM"];

    // Combine FIXED_SECTORS with any API presets if needed
    const presets: DepartmentPreset[] = useMemo(() => {
        return FIXED_SECTORS.map(s => ({
            id: s.id,
            name: s.label,
            campus: s.campus,
            sector: s.label,
            type: s.baseShift,
            horario: s.baseShift.includes("12x36") ? "07h às 19h" : "08h às 17h",
            refeicao: "A definir",
            timeStart: "07:00",
            timeEnd: "19:00",
            team: (s.team && s.team.length === 1) ? s.team[0] : undefined
        }));
    }, []);

    const handleToggleSector = (sector: string) => {
        const newSet = new Set(expandedSectors);
        if (newSet.has(sector)) newSet.delete(sector);
        else newSet.add(sector);
        setExpandedSectors(newSet);
    };

    const handleUpdateVigilante = async (mat: string, changes: Partial<Vigilante>) => {
        console.log("UPDATE REQ:", mat, changes);

        // Find by ID or MAT for safety
        const vig = vigilantes.find(v => v.matricula === mat || v.id?.toString() === mat);
        if (!vig) {
            console.error("Vigilante not found for update:", mat);
            return;
        }

        try {
            // Case 1: Unassignment (sent to "SEM POSTO")
            if (changes.campus === "SEM POSTO" || changes.campus === "A DEFINIR") {
                // If we have an allocation ID, delete it
                if ((vig as any).posto_id) {
                    await removeAlocacao((vig as any).id);
                }
                // If it's just local state update or new vigilante, we logic handled by hook? 
                // The hook removeAlocacao handles the API call.
            }
            // Case 2: Assignment (sent to a Sector/Preset)
            else if (changes.setor) {
                // We need to map the "Preset Name" back to a Posto ID if possible, 
                // OR create a new allocation record via alocarVigilante
                console.warn("Real Post Allocation needs Post ID lookup!", changes);

                // Example: alocarVigilante({ vigilante_id: vig.id, posto_id: ..., ... })
            }
        } catch (error) {
            console.error("Update failed:", error);
        }
    };

    if (loading) {
        console.log("Alocacao Page: Rendering Loading State");
        return <div className="h-full flex items-center justify-center bg-slate-950 text-slate-400">Carregando...</div>;
    }

    if (error) {
        console.error("Alocacao Page: Rendering Error State:", error);
        return <div className="h-full flex items-center justify-center bg-slate-950 text-red-400">Erro: {error}</div>;
    }

    console.log("Alocacao Page: Rendering Main View. Presets:", presets.length);

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
                <AlocacaoView
                    currentLabel={currentLabel}
                    month={currentMonthNum}
                    vigilantes={vigilantes as unknown as Vigilante[]}
                    presets={presets}
                    expandedSectors={expandedSectors}
                    toggleSectorExpansion={handleToggleSector}
                    onUpdateVigilante={handleUpdateVigilante}
                    lancadorVisibleTeams={lancadorVisibleTeams}
                    isMaster={isMaster}
                    userPermissions={userPermissions}
                />
            </div>
        </div>
    );
};

export default Alocacao;
