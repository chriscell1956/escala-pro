import React, { useState } from "react";
import { Icons, Card, Button } from "../ui";
import { api } from "../../services/api";

export const ConfigView = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleWipe = async () => {
        if (
            !confirm(
                "TEM CERTEZA? Isso apagará TODAS as ALOCAÇÕES deste mês. A lista de vigilantes será mantida, mas a escala será zerada. Digite 'ZERAR' para confirmar.",
            )
        )
            return;

        const confirm2 = prompt("Digite ZERAR para confirmar:");
        if (confirm2 !== "ZERAR") return;

        setLoading(true);
        try {
            // Assuming api.ts has a method for this, otherwise we use raw fetch or add it to api.ts
            // Since api.ts is just a wrapper, we can call fetch directly to the maintenance endpoint
            const res = await fetch("/api/maintenance/wipe-schedule", {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                setStatus("Escala zerada com sucesso!");
                alert("Sistema limpo. Recarregue a página.");
                window.location.reload();
            } else {
                setStatus("Erro ao limpar: " + (data.error || "Desconhecido"));
            }
        } catch (e) {
            setStatus("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleSeedUsers = async () => {
        if (!confirm("Isso criará usuários (Login) para todos os vigilantes da escala atual que ainda não têm acesso. Deseja continuar?")) return;

        setLoading(true);
        setStatus("Iniciando criação de usuários...");

        try {
            // 1. Load current data to get the list of vigilantes
            const now = new Date();
            const currentMonth = now.getFullYear() * 100 + (now.getMonth() + 1);
            const data = await api.loadData(currentMonth);

            if (!data || data.length === 0) {
                setStatus("Erro: Escala vazia ou não carregada.");
                return;
            }

            // 2. Call Seed
            await api.seedUsers(data);
            setStatus("Processo finalizado! Tente fazer login agora.");
            alert("Usuários criados/atualizados com sucesso!");
        } catch (e) {
            console.error(e);
            setStatus("Erro ao criar usuários.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand-700/20 p-2 rounded-lg text-brand-400">
                    <Icons.Settings className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Manutenção do Sistema
                    </h1>
                    <p className="text-slate-400">Ferramentas avançadas de gestão</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-red-900/50 bg-red-900/10">
                    <div className="flex items-start gap-4">
                        <div className="bg-red-500/10 p-3 rounded-full text-red-500">
                            <Icons.Trash className="w-6 h-6" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-red-200">
                                    Zerar Escala (Manter Vigilantes)
                                </h3>
                                <p className="text-sm text-red-300/70 mt-1">
                                    Remove todas as alocações, dias trabalhados e definições de
                                    equipe/setor do mês atual. A lista de nomes/matriculas dos
                                    vigilantes NÃO será apagada.
                                </p>
                            </div>
                            <Button
                                variant="danger"
                                className="w-full justify-center font-bold"
                                onClick={handleWipe}
                                disabled={loading}
                            >
                                {loading ? "Processando..." : "ZERAR TUDO"}
                            </Button>
                            {status && (
                                <p className="text-xs text-center font-mono bg-black/30 p-2 rounded text-red-200">
                                    {status}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-blue-900/50 bg-blue-900/10">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-500/10 p-3 rounded-full text-blue-500">
                            <Icons.Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-blue-200">
                                    Popular Banco de Usuários
                                </h3>
                                <p className="text-sm text-blue-300/70 mt-1">
                                    Cria automaticamente contas de acesso (Login) para todos os vigilantes
                                    presentes na escala deste mês. A senha padrão será "123456".
                                </p>
                            </div>
                            <Button
                                className="w-full justify-center font-bold bg-blue-600 hover:bg-blue-500"
                                onClick={handleSeedUsers}
                                disabled={loading}
                            >
                                {loading ? "Processando..." : "CRIAR USUÁRIOS"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
