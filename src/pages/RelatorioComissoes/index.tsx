import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Bar } from 'react-chartjs-2';

// Interfaces
interface Funcionario { id: number; nome: string; }
interface DetalheComissao {
    funcionario_nome: string;
    servico_nome: string;
    base_calculo: number;
    valor_comissao: number;
    data_criacao: string;
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
    const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
    const [loading, setLoading] = useState(false);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));
    const [funcionarioId, setFuncionarioId] = useState('todos');

    useEffect(() => {
        api.get('/funcionarios').then(res => setFuncionarios(res.data));
    }, []);

    const fetchRelatorio = useCallback(async () => {
        setLoading(true);
        try {
            const params = { data_inicio: dataInicio, data_fim: dataFim, funcionario_id: funcionarioId };
            const response = await api.get('/relatorios/comissao', { params });
            setRelatorio(response.data);
        } catch (error) {
            alert('Erro ao buscar relatório.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim, funcionarioId]);

    useEffect(() => {
        fetchRelatorio();
    }, [fetchRelatorio]);

    const chartData = {
        labels: relatorio?.dadosGrafico.map(d => d.funcionario_nome) || [],
        datasets: [{
            label: 'Total de Comissões (R$)',
            data: relatorio?.dadosGrafico.map(d => d.total_comissao) || [],
            backgroundColor: '#ca1444',
        }],
    };
    
    const totalComissoes = relatorio?.detalhes.reduce((acc, item) => acc + Number(item.valor_comissao), 0) || 0;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Relatório de Comissões</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-fundo-secundario rounded-lg">
                <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2">Funcionário</label>
                    <select value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg">
                        <option value="todos">Todos</option>
                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <Button onClick={fetchRelatorio} disabled={loading} className="w-full">
                        {loading ? 'A buscar...' : 'Aplicar Filtros'}
                    </Button>
                </div>
            </div>
            
            <div className="bg-fundo-secundario p-6 rounded-lg shadow-lg text-center mb-8">
                <p className="text-texto-secundario text-sm font-medium">Total de Comissões no Período</p>
                <p className="text-4xl font-bold text-green-500">{totalComissoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>

            {relatorio && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Comissões por Funcionário</h2>
                        <Bar data={chartData} />
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-lg">
                         <h2 className="text-xl font-bold text-white mb-4">Detalhes</h2>
                         <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-700"><tr><th className="p-2">Funcionário</th><th className="p-2">Serviço</th><th className="p-2">Comissão</th></tr></thead>
                                <tbody>
                                    {relatorio.detalhes.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-700"><td className="p-2">{item.funcionario_nome}</td><td className="p-2">{item.servico_nome}</td><td className="p-2">{Number(item.valor_comissao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
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