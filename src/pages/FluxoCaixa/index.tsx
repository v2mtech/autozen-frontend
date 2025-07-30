import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Line } from 'react-chartjs-2';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
            const functions = getFunctions();
            const getFluxoCaixa = httpsCallable(functions, 'getFluxoCaixa');
            const response: any = await getFluxoCaixa({ data_inicio: dataInicio, data_fim: dataFim });
            setFluxoData(response.data);
        } catch (error) {
            alert('Erro ao buscar fluxo de caixa.');
            console.error("Erro ao chamar Cloud Function getFluxoCaixa:", error);
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim]);

    useEffect(() => {
        fetchFluxo();
    }, [fetchFluxo]);

    const chartLabels = Array.from(new Set([
        ...(fluxoData?.receitas.map(r => new Date(r.dia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })) || []),
        ...(fluxoData?.despesas.map(d => new Date(d.dia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })) || [])
    ])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const chartData = {
        labels: chartLabels,
        datasets: [
            { label: 'Receitas (R$)', data: chartLabels.map(label => fluxoData?.receitas.find(r => new Date(r.dia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) === label)?.total || 0), backgroundColor: '#08807b', borderColor: '#08807b' },
            { label: 'Despesas (R$)', data: chartLabels.map(label => fluxoData?.despesas.find(d => new Date(d.dia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) === label)?.total || 0), backgroundColor: '#fc036c', borderColor: '#fc036c' }
        ]
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Relatório de Fluxo de Caixa</h1>
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
                        <Button onClick={fetchFluxo} disabled={loading}>{loading ? 'A calcular...' : 'Aplicar Filtros'}</Button>
                    </div>
                </div>
            </div>

            <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                <h2 className="text-xl font-bold text-texto-principal mb-4">Receitas vs. Despesas no Período</h2>
                {fluxoData && <Line data={chartData} />}
            </div>
        </div>
    );
}