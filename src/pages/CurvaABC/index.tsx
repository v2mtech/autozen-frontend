import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Pie } from 'react-chartjs-2';

interface CurvaABCItem {
    nome: string;
    quantidade_vendida: number;
    valor_total: number;
    participacao: string;
    acumulado: string;
    classe: 'A' | 'B' | 'C';
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
            const params = { data_inicio: dataInicio, data_fim: dataFim };
            const response = await api.get('/relatorios/curva-abc', { params });
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
            backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'],
        }],
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Relatório Curva ABC de Produtos</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-fundo-secundario rounded-lg">
                <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                <div className="flex items-end"><Button onClick={fetchRelatorio} disabled={loading}>{loading ? 'A buscar...' : 'Aplicar Filtros'}</Button></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-fundo-secundario p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Detalhes da Curva ABC</h2>
                    <table className="w-full text-left">
                        <thead className="bg-gray-700"><tr><th className="p-2">Classe</th><th className="p-2">Produto</th><th className="p-2">Valor Total</th><th className="p-2">Participação</th></tr></thead>
                        <tbody>
                            {relatorio.map(item => (
                                <tr key={item.nome} className="border-b border-gray-700">
                                    <td className="p-2 font-bold">{item.classe}</td>
                                    <td className="p-2">{item.nome}</td>
                                    <td className="p-2">{Number(item.valor_total).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
                                    <td className="p-2">{item.participacao}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-fundo-secundario p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Distribuição do Faturamento</h2>
                    <Pie data={chartData} />
                </div>
            </div>
        </div>
    );
}