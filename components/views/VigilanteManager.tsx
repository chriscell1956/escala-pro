import React, { useState, useMemo } from "react";
import { Vigilante, Team } from "../../types";
import { TEAM_OPTIONS } from "../../constants";
import { Button, Input, Modal, Select, Badge, Icons } from "../ui";

interface VigilanteManagerProps {
    isOpen: boolean;
    onClose: () => void;
    data: Vigilante[];
    onUpdateVigilante: (vig: Vigilante) => void;
}

export const VigilanteManager: React.FC<VigilanteManagerProps> = ({
    isOpen,
    onClose,
    data,
    onUpdateVigilante,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [editingVig, setEditingVig] = useState<Vigilante | null>(null);

    // Filter list
    const filteredList = useMemo(() => {
        if (!searchTerm) return [];
        const lower = searchTerm.toLowerCase();
        return data
            .filter(
                (v) =>
                    v.nome.toLowerCase().includes(lower) ||
                    v.mat.toLowerCase().includes(lower),
            )
            .slice(0, 50); // Limit results for performance
    }, [data, searchTerm]);

    const handleSave = () => {
        if (editingVig) {
            onUpdateVigilante(editingVig);
            setEditingVig(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gerenciador Global de Vigilantes"
        >
            <div className="space-y-4 min-h-[50vh]">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs text-blue-800">
                    <p className="font-bold">Como usar:</p>
                    <p>
                        Use esta ferramenta para encontrar vigilantes "perdidos" ou com
                        cadastros incorretos. A busca varre toda a base de dados,
                        independente da equipe ou setor atual.
                    </p>
                </div>

                <div>
                    <Input
                        placeholder="Digite Nome ou Matrícula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-700 text-white border-slate-600"
                        autoFocus
                    />
                </div>

                {editingVig ? (
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                            <h3 className="font-bold text-white text-lg">
                                Editando: {editingVig.nome}
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={() => setEditingVig(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                Voltar
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    Matrícula
                                </label>
                                <div className="text-slate-200 font-mono bg-slate-900 p-2 rounded border border-slate-700">
                                    {editingVig.mat}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    Equipe Atual
                                </label>
                                <Select
                                    value={editingVig.eq}
                                    onChange={(e) =>
                                        setEditingVig({ ...editingVig, eq: e.target.value as Team })
                                    }
                                    className="bg-slate-700 text-white border-slate-600"
                                >
                                    <option value="A">Equipe A</option>
                                    <option value="B">Equipe B</option>
                                    <option value="C">Equipe C</option>
                                    <option value="D">Equipe D</option>
                                    <option value="ECO1">ECO 1</option>
                                    <option value="ECO2">ECO 2</option>
                                    <option value="ADM">ADM</option>
                                    <option value="AFASTADOS">AFASTADOS</option>
                                </Select>
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    Setor (Posto)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={editingVig.setor}
                                        onChange={(e) =>
                                            setEditingVig({
                                                ...editingVig,
                                                setor: e.target.value.toUpperCase(),
                                            })
                                        }
                                        className="flex-1 bg-slate-700 text-white border-slate-600 uppercase"
                                    />
                                    <Button
                                        onClick={() =>
                                            setEditingVig({
                                                ...editingVig,
                                                setor: "A DEFINIR",
                                                campus: "A DEFINIR",
                                            })
                                        }
                                        className="bg-slate-600 hover:bg-slate-500 text-white text-xs"
                                        title="Resetar para A DEFINIR"
                                    >
                                        Resetar
                                    </Button>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    * Dica: Se o vigilante sumiu, tente mudar a equipe ou resetar o
                                    setor para "A DEFINIR".
                                </p>
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    Campus
                                </label>
                                <Select
                                    value={editingVig.campus}
                                    onChange={(e) =>
                                        setEditingVig({ ...editingVig, campus: e.target.value })
                                    }
                                    className="bg-slate-700 text-white border-slate-600"
                                >
                                    <option>CAMPUS I - DIURNO</option>
                                    <option>CAMPUS I - NOTURNO</option>
                                    <option>CAMPUS II - DIURNO</option>
                                    <option>CAMPUS II - NOTURNO</option>
                                    <option>CAMPUS III - DIURNO</option>
                                    <option>CAMPUS III - NOTURNO</option>
                                    <option>CHÁCARA DA REITORIA</option>
                                    <option>A DEFINIR</option>
                                    <option>OUTROS</option>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                            <Button
                                onClick={() => setEditingVig(null)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} className="flex-1 bg-emerald-600">
                                <Icons.Save className="w-4 h-4 mr-2" /> Salvar Alterações
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-800 p-2 text-xs font-bold text-slate-400 border-b border-slate-700 flex">
                            <div className="flex-1">Nome</div>
                            <div className="w-20 text-center">Eq</div>
                            <div className="w-24 text-center">Ação</div>
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-700 bg-slate-900">
                            {filteredList.length > 0 ? (
                                filteredList.map((vig) => (
                                    <div
                                        key={vig.mat}
                                        className="p-2 flex items-center hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-200 truncate">
                                                {vig.nome}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {vig.mat} | {vig.setor}
                                            </div>
                                        </div>
                                        <div className="w-20 text-center">
                                            <Badge team={vig.eq} />
                                        </div>
                                        <div className="w-24 text-center">
                                            <Button
                                                onClick={() => setEditingVig(vig)}
                                                className="h-7 text-[10px] bg-slate-700 hover:bg-brand-600 text-white border border-slate-600"
                                            >
                                                <Icons.Edit className="w-3 h-3 mr-1" /> Editar
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    {searchTerm
                                        ? "Nenhum vigilante encontrado."
                                        : "Digite para buscar..."}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
