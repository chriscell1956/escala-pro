
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { getDaysInMonth } from 'date-fns';
import { Trash2, Save } from 'lucide-react';

interface GerenciarEscalaModalProps {
    isOpen: boolean;
    onClose: () => void;
    vigilante: any;
    post: any;
    allocation: any; // { id, dias, ... }
    year: number;
    month: number;
    onSave: (dias: number[]) => Promise<void>;
    onRemove: () => Promise<void>;
}

export function GerenciarEscalaModal({
    isOpen,
    onClose,
    vigilante,
    post,
    allocation,
    year,
    month,
    onSave,
    onRemove
}: GerenciarEscalaModalProps) {
    const [activeTab, setActiveTab] = useState<'DADOS' | 'DIAS' | 'FERIAS'>('DIAS');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);

    useEffect(() => {
        if (allocation && allocation.dias) {
            setSelectedDays([...allocation.dias]);
        } else {
            setSelectedDays([]);
        }
    }, [allocation]);

    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    const handleSave = async () => {
        await onSave(selectedDays);
        onClose();
    };

    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    // Helper to get day of week index (0-6) for the 1st of month to align grid?
    // For now, simple grid.

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Gerenciar Escala: ${vigilante?.nome}`}
            width="600px"
        >
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
                <TabButton label="DADOS" active={activeTab === 'DADOS'} onClick={() => setActiveTab('DADOS')} />
                <TabButton label="DIAS" active={activeTab === 'DIAS'} onClick={() => setActiveTab('DIAS')} />
                <TabButton label="FÉRIAS" active={activeTab === 'FERIAS'} onClick={() => setActiveTab('FERIAS')} />
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'DADOS' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 font-bold block mb-1">MATRÍCULA</label>
                                <input type="text" disabled value={vigilante?.matricula} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white opacity-50" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold block mb-1">EQUIPE</label>
                                <input type="text" disabled value={vigilante?.equipe} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white opacity-50" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-bold block mb-1">POSTO ATUAL</label>
                            <div className="bg-slate-800 border border-slate-700 rounded p-3 text-white">
                                {post?.setores?.nome}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'DIAS' && (
                    <div className="select-none">
                        <div className="text-xs text-slate-400 mb-2">Selecione os dias de trabalho (Azul = Trabalhando):</div>
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {weekDays.map((d, i) => <div key={i} className="text-center text-xs font-bold text-slate-600">{d}</div>)}
                            {/* Note: Correct alignment needs Date object for 1st day. Skipping for simplicity unless requested. */}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map(d => {
                                const isSelected = selectedDays.includes(d);
                                return (
                                    <div
                                        key={d}
                                        onClick={() => toggleDay(d)}
                                        className={`
                                            h-10 flex items-center justify-center rounded font-bold text-sm cursor-pointer transition-all
                                            ${isSelected
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                            }
                                        `}
                                    >
                                        {d}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'FERIAS' && (
                    <div className="flex flex-col items-center justify-center h-[200px] text-slate-500">
                        <p>Funcionalidade de Férias em breve.</p>
                        <p className="text-xs mt-2">Use o menu "Gestão de Férias" principal por enquanto.</p>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-slate-700 pt-4">
                <button
                    onClick={async () => {
                        if (confirm('Remover este vigilante da escala?')) {
                            await onRemove();
                            onClose();
                        }
                    }}
                    className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1 font-bold"
                >
                    <Trash2 size={14} /> Excluir Vigilante
                </button>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancelar</button>
                    <button
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded flex items-center gap-2"
                    >
                        <Save size={16} /> SALVAR ALTERAÇÕES
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-4 py-1.5 rounded text-xs font-bold transition-all
                ${active ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}
            `}
        >
            {label}
        </button>
    );
}
