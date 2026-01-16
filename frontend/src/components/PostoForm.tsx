import React, { useState, useEffect } from 'react';
import { TimeSelect } from './TimeSelect';
import { AlertTriangle, Clock, Check } from 'lucide-react';

interface PostoFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isEditing?: boolean;
}

export const PostoForm: React.FC<PostoFormProps> = ({ initialData, onSubmit, onCancel, isEditing }) => {

    // Basic Info
    const [nome, setNome] = useState('');
    const [campus, setCampus] = useState('CAMPUS I');
    const [equipe, setEquipe] = useState('A');
    const [jornadaNome, setJornadaNome] = useState('12x36');
    const [viraDia, setViraDia] = useState(false);

    // Time
    const [horaInicio, setHoraInicio] = useState('06:00');
    const [horaFim, setHoraFim] = useState('18:00');

    // Meal
    const [refeicaoInicio, setRefeicaoInicio] = useState('12:00');
    const [refeicaoFim, setRefeicaoFim] = useState('13:00');

    // Errors
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setNome(initialData.nome || '');
            setCampus(initialData.campus || 'CAMPUS I');
            setEquipe(initialData.equipe || 'A');
            setJornadaNome(initialData.jornada_nome || '12x36');

            // Times
            const start = initialData.hora_inicio?.slice(0, 5) || '06:00';
            const end = initialData.hora_fim?.slice(0, 5) || '18:00';
            setHoraInicio(start);
            setHoraFim(end);

            const sMin = timeToMinutes(start);
            const eMin = timeToMinutes(end);
            if (eMin <= sMin) setViraDia(true);
            else setViraDia(false);

            // Meal
            const ref = initialData.refeicao || '';
            if (ref && ref.includes('-')) {
                const [rStart, rEnd] = ref.split('-').map((s: string) => s.trim());
                setRefeicaoInicio(rStart);
                setRefeicaoFim(rEnd);
            } else {
                setRefeicaoInicio('12:00');
                setRefeicaoFim('13:00');
            }
        }
    }, [initialData]);

    const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const validate = () => {
        const newErrors: string[] = [];
        const sMin = timeToMinutes(horaInicio);
        let eMin = timeToMinutes(horaFim);

        if (viraDia) eMin += 24 * 60;

        if (eMin <= sMin) {
            newErrors.push('Horário Fim deve ser maior que Início (ou marque "Vira o dia").');
        }

        const rsMin = timeToMinutes(refeicaoInicio);
        const reMin = timeToMinutes(refeicaoFim);
        if (reMin <= rsMin) newErrors.push('Refeição: Fim deve ser maior que Início.');

        let shiftStart = sMin;
        let shiftEnd = eMin;
        let mealStart = rsMin;
        let mealEnd = reMin;

        if (viraDia && mealStart < sMin) {
            mealStart += 24 * 60;
            mealEnd += 24 * 60;
        }

        if (mealStart < shiftStart || mealEnd > shiftEnd) {
            newErrors.push('Refeição deve estar dentro do horário do turno.');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const data = {
            nome,
            campus,
            equipe,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            refeicao: `${refeicaoInicio} - ${refeicaoFim}`,
            jornada_nome: jornadaNome
        };
        onSubmit(data);
    };

    // Styles
    const labelStyle = "block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide";
    const inputStyle = "bg-[#334155]/40 border border-[#334155] rounded-md px-4 py-3 text-slate-200 outline-none focus:border-blue-500 w-full transition-all";
    const selectStyle = "bg-[#334155]/40 border border-[#334155] rounded-md px-4 py-3 text-slate-200 outline-none focus:border-blue-500 w-full appearance-none cursor-pointer transition-all";

    return (
        <div className="p-1 space-y-6">

            {/* ROW 1: Name */}
            <div>
                <label className={labelStyle}>Nome do Posto (Identificador)</label>
                <input
                    type="text"
                    placeholder="Ex: Portaria Principal - Manhã"
                    className={inputStyle}
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                />
            </div>

            {/* ROW 2: Campus | Equipe */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyle}>Campus</label>
                    <select
                        className={selectStyle}
                        value={campus}
                        onChange={e => setCampus(e.target.value)}
                    >
                        <option>CAMPUS I</option>
                        <option>CAMPUS II</option>
                        <option>CAMPUS III</option>
                    </select>
                </div>
                <div>
                    <label className={labelStyle}>Equipe Fixa (Opcional)</label>
                    <select
                        className={selectStyle}
                        value={equipe}
                        onChange={e => setEquipe(e.target.value)}
                    >
                        <option value="A">Equipe A</option>
                        <option value="B">Equipe B</option>
                        <option value="C">Equipe C</option>
                        <option value="D">Equipe D</option>
                    </select>
                </div>
            </div>

            {/* ROW 3: Turno */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyle}>Tipo de Turno / Escala</label>
                    <select
                        className={selectStyle}
                        value={jornadaNome}
                        onChange={e => setJornadaNome(e.target.value)}
                    >
                        <option value="12x36">12x36 Diurno</option>
                        <option value="12x36 Noturno">12x36 Noturno</option>
                        <option value="5x2">5x2 Comercial</option>
                        <option value="SD">Serviço Diário</option>
                    </select>
                </div>
                <div className="flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                        <input
                            type="checkbox"
                            checked={viraDia}
                            onChange={e => setViraDia(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-500 bg-transparent accent-emerald-500"
                        />
                        <span className="text-sm text-slate-300">Turno Noturno (Vira o dia)</span>
                    </label>
                </div>
            </div>

            <div className="h-px bg-slate-700/50 my-4"></div>

            {/* TIMES HEADER */}
            <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase">Meus Horários</h3>
            </div>

            {/* ROW 4: Shift Times */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#334155]/20 p-3 rounded-md border border-[#334155]/50">
                    <label className={labelStyle}>Horário Início</label>
                    <TimeSelect value={horaInicio} onChange={setHoraInicio} className="w-full justify-center" />
                </div>
                <div className="bg-[#334155]/20 p-3 rounded-md border border-[#334155]/50">
                    <label className={labelStyle}>Horário Fim</label>
                    <TimeSelect value={horaFim} onChange={setHoraFim} className="w-full justify-center" />
                </div>
            </div>

            {/* ROW 5: Meal Times */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#334155]/20 p-3 rounded-md border border-[#334155]/50">
                    <label className={labelStyle}>Refeição Início</label>
                    <TimeSelect value={refeicaoInicio} onChange={setRefeicaoInicio} className="w-full justify-center" />
                </div>
                <div className="bg-[#334155]/20 p-3 rounded-md border border-[#334155]/50">
                    <label className={labelStyle}>Refeição Fim</label>
                    <TimeSelect value={refeicaoFim} onChange={setRefeicaoFim} className="w-full justify-center" />
                </div>
            </div>

            {/* ERRORS */}
            {errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-900/50 p-3 rounded flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle size={16} />
                    <span>{errors[0]}</span>
                </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button onClick={onCancel} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors">
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-md shadow-lg transition-all flex items-center gap-2 text-sm uppercase tracking-wide"
                >
                    <Check size={18} /> {isEditing ? 'Salvar Posto' : 'Criar Posto'}
                </button>
            </div>

        </div>
    );
};
