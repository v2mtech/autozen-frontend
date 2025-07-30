import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Pie } from 'react-chartjs-2';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface CurvaABCItem {
    nome: string;
    valor_total: number;
    classe: 'A' | 'B' | 'C';
    participacao: string;
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function CurvaABCPage() {
    const [relatorio, setRelatorio] = useState<CurvaABCItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));

    const fetchRelatorio = useCallback(async () => {
        setLoading(true);
        try {
            const functions = getFunctions();
            const getCurvaABC = httpsCallable(functions, 'getCurvaABC');
            const response: any = await getCurvaABC({ data_inicio: dataInicio, data_fim: dataFim });
            setRelatorio(response.data);
        } catch (error) {
            alert('Erro ao buscar relatório de Curva ABC.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim]);

    useEffect(() => {
        fetchRelatorio();
    }, [fetchRelatorio]);

    const chartData = {
        labels: ['Classe A (80%)', 'Classe B (15%)', 'Classe C (5%)'],
        datasets: [{
            data: [
                relatorio.filter(p => p.classe === 'A').reduce((acc, p) => acc + parseFloat(p.valor_total.toString()), 0),
                relatorio.filter(p => p.classe === 'B').reduce((acc, p) => acc + parseFloat(p.valor_total.toString()), 0),
                relatorio.filter(p => p.classe === 'C').reduce((acc, p) => acc + parseFloat(p.valor_total.toString()), 0),
            ],
            backgroundColor: ['#420b58', '#f1a20b', '#08807b'],
        }],
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Relatório Curva ABC de Produtos</h1>

            <div className="bg-fundo-secundario p-4 rounded-lg shadow-sm mb-8 border border-borda">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-auto">
                        <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                    <div className="w-full md:w-auto">
                        <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                    <div className="flex-grow"></div>
                    <div className="w-full md:w-auto">
                        <Button onClick={fetchRelatorio} disabled={loading}>{loading ? 'A buscar...' : 'Aplicar Filtros'}</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                    <h2 className="text-xl font-bold text-texto-principal mb-4">Detalhes da Curva ABC</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-borda bg-fundo-principal">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Classe</th>
                                    <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Produto</th>
                                    <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Valor Total</th>
                                    <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Participação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-borda">
                                {relatorio.map(item => (
                                    <tr key={item.nome}>
                                        <td className="p-3 font-bold text-texto-principal">{item.classe}</td>
                                        <td className="p-3 text-texto-principal">{item.nome}</td>
                                        <td className="p-3 text-texto-secundario">{Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-3 text-texto-secundario">{item.participacao}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                    <h2 className="text-xl font-bold text-texto-principal mb-4">Distribuição do Faturamento</h2>
                    <Pie data={chartData} />
                </div>
            </div>
        </div>
    );
}