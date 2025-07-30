import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebaseConfig';

// Interfaces
interface Funcionario { id: string; nome: string; }
interface DetalheComissao {
    funcionario_nome: string;
    servico_nome: string;
    valor_comissao: number;
}
interface DadosGrafico {
    funcionario_nome: string;
    total_comissao: number;
}
interface Relatorio {
    detalhes: DetalheComissao[];
    dadosGrafico: DadosGrafico[];
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function RelatorioComissoesPage() {
    const { user } = useAuth();
    const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
    const [loading, setLoading] = useState(false);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));
    const [funcionarioId, setFuncionarioId] = useState('todos');

    useEffect(() => {
        const fetchFuncionarios = async () => {
            if (!user) return;
            const funcRef = collection(db, 'funcionarios');
            const q = query(funcRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            setFuncionarios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funcionario)));
        };
        fetchFuncionarios();
    }, [user]);

    const fetchRelatorio = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const functions = getFunctions();
            const getRelatorioComissao = httpsCallable(functions, 'getRelatorioComissao');
            const response: any = await getRelatorioComissao({
                data_inicio: dataInicio,
                data_fim: dataFim,
                funcionario_id: funcionarioId === 'todos' ? null : funcionarioId
            });
            setRelatorio(response.data);
        } catch (error) {
            alert('Erro ao buscar relatório.');
        } finally {
            setLoading(false);
        }
    }, [user, dataInicio, dataFim, funcionarioId]);

    useEffect(() => {
        fetchRelatorio();
    }, [fetchRelatorio]);

    const chartData = {
        labels: relatorio?.dadosGrafico.map(d => d.funcionario_nome) || [],
        datasets: [{
            label: 'Total de Comissões (R$)',
            data: relatorio?.dadosGrafico.map(d => d.total_comissao) || [],
            backgroundColor: '#420b58',
        }],
    };

    const totalComissoes = relatorio?.detalhes.reduce((acc, item) => acc + Number(item.valor_comissao), 0) || 0;

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Relatório de Comissões</h1>

            <div className="bg-fundo-secundario p-4 rounded-lg shadow-sm mb-8 border border-borda">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-auto">
                        <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                    <div className="w-full md:w-auto">
                        <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                    <div className="flex-grow">
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Funcionário</label>
                        <select value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="todos">Todos</option>
                            {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <Button onClick={fetchRelatorio} disabled={loading} className="w-full">
                            {loading ? 'A buscar...' : 'Filtrar'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-fundo-secundario p-6 rounded-lg shadow text-center mb-8 border border-borda">
                <p className="text-texto-secundario text-sm font-medium">Total de Comissões no Período</p>
                <p className="text-4xl font-bold text-green-600">{totalComissoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>

            {relatorio && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow border border-borda">
                        <h2 className="text-xl font-bold text-texto-principal mb-4">Comissões por Funcionário</h2>
                        <Bar data={chartData} />
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow border border-borda">
                        <h2 className="text-xl font-bold text-texto-principal mb-4">Detalhes</h2>
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-borda bg-fundo-principal sticky top-0">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Funcionário</th>
                                        <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Serviço</th>
                                        <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Comissão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-borda">
                                    {relatorio.detalhes.map((item, index) => (
                                        <tr key={index}><td className="p-3 text-texto-principal">{item.funcionario_nome}</td><td className="p-3 text-texto-principal">{item.servico_nome}</td><td className="p-3 text-texto-principal">{Number(item.valor_comissao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}