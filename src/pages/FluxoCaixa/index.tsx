import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Line } from 'react-chartjs-2';

interface FluxoData {
    receitas: { dia: string, total: number }[];
    despesas: { dia: string, total: number }[];
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function FluxoCaixaPage() {
    const [fluxoData, setFluxoData] = useState<FluxoData | null>(null);
    const [loading, setLoading] = useState(false);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));

    const fetchFluxo = useCallback(async () => {
        setLoading(true);
        try {
            const params = { data_inicio: dataInicio, data_fim: dataFim };
            const response = await api.get('/relatorios/fluxo-caixa', { params });
            setFluxoData(response.data);
        } catch (error) {
            alert('Erro ao buscar fluxo de caixa.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim]);

    useEffect(() => {
        fetchFluxo();
    }, [fetchFluxo]);

    const chartLabels = Array.from(new Set([
        ...(fluxoData?.receitas.map(r => new Date(r.dia).toLocaleDateString('pt-BR')) || []),
        ...(fluxoData?.despesas.map(d => new Date(d.dia).toLocaleDateString('pt-BR')) || [])
    ])).sort();

    const chartData = {
        labels: chartLabels,
        datasets: [
            { label: 'Receitas (R$)', data: chartLabels.map(label => fluxoData?.receitas.find(r => new Date(r.dia).toLocaleDateString('pt-BR') === label)?.total || 0), backgroundColor: '#10B981', borderColor: '#10B981' },
            { label: 'Despesas (R$)', data: chartLabels.map(label => fluxoData?.despesas.find(d => new Date(d.dia).toLocaleDateString('pt-BR') === label)?.total || 0), backgroundColor: '#EF4444', borderColor: '#EF4444' }
        ]
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Relatório de Fluxo de Caixa</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-fundo-secundario rounded-lg">
                <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                <div className="flex items-end"><Button onClick={fetchFluxo} disabled={loading}>{loading ? 'A calcular...' : 'Aplicar Filtros'}</Button></div>
            </div>

            <div className="bg-fundo-secundario p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Receitas vs. Despesas no Período</h2>
                {fluxoData && <Line data={chartData} />}
            </div>
        </div>
    );
}