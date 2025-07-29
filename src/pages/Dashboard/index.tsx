import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement, DoughnutController, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { FaSearch } from 'react-icons/fa';

const SearchIcon = FaSearch as React.ElementType;

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement, DoughnutController, Filler);

// Interfaces
interface AnalyticsData {
    faturamentoTotal: number;
    faturamentoPorFormaPagamento: { nome: string; total: number }[];
    orcamentosAprovados: { dia: string; quantidade: number }[];
    topServicos: { nome: string; quantidade: number }[];
    servicosPorFuncionario: { nome: string; quantidade: number }[];
}

const ChartMenu = ({ onExportXLSX }: { onExportXLSX: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);
    return (
        <div ref={menuRef} className="absolute top-4 right-4">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-texto-principal">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-fundo-secundario border border-borda rounded-md shadow-lg z-10">
                    <button onClick={onExportXLSX} className="block w-full text-left px-4 py-2 text-sm text-texto-principal hover:bg-fundo-principal">Exportar para XLSX</button>
                </div>
            )}
        </div>
    );
};

const exportToXLSX = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function DashboardPage() {
    const [analyticsData, setAnalyticsData] = useState<Partial<AnalyticsData>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/relatorios/dashboard-analytics`, { params: { data_inicio: dataInicio, data_fim: dataFim } });
            if (response.data) {
                setAnalyticsData(response.data);
            } else {
                throw new Error("A resposta da API não continha dados.");
            }
        } catch (err) {
            console.error("Erro ao buscar dados do dashboard:", err);
            setError('Não foi possível carregar os dados do dashboard. Verifique a sua ligação ou tente mais tarde.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    const chartColors = ['#5E60CE', '#4EA8DE', '#50B498', '#F5A623', '#FA6E59', '#D9534F'];

    const pagamentosData = {
        labels: Array.isArray(analyticsData.faturamentoPorFormaPagamento) ? analyticsData.faturamentoPorFormaPagamento.map(p => p.nome) : [],
        datasets: [{ data: Array.isArray(analyticsData.faturamentoPorFormaPagamento) ? analyticsData.faturamentoPorFormaPagamento.map(p => p.total) : [], backgroundColor: chartColors }],
    };

    const orcamentosData = {
        labels: Array.isArray(analyticsData.orcamentosAprovados) ? analyticsData.orcamentosAprovados.map(o => new Date(o.dia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })) : [],
        datasets: [{ label: 'Orçamentos Aprovados', data: Array.isArray(analyticsData.orcamentosAprovados) ? analyticsData.orcamentosAprovados.map(o => o.quantidade) : [], borderColor: chartColors[1], backgroundColor: `${chartColors[1]}33`, fill: true, tension: 0.3 }],
    };

    const funcionariosData = {
        labels: Array.isArray(analyticsData.servicosPorFuncionario) ? analyticsData.servicosPorFuncionario.map(f => f.nome) : [],
        datasets: [{ label: 'Serviços Realizados', data: Array.isArray(analyticsData.servicosPorFuncionario) ? analyticsData.servicosPorFuncionario.map(f => f.quantidade) : [], backgroundColor: chartColors }],
    };

    const topServicosData = {
        labels: Array.isArray(analyticsData.topServicos) ? analyticsData.topServicos.map(s => s.nome) : [],
        datasets: [{ label: 'Quantidade', data: Array.isArray(analyticsData.topServicos) ? analyticsData.topServicos.map(s => s.quantidade) : [], backgroundColor: chartColors }],
    };

    // ✅ OPÇÕES PARA O GRÁFICO DE BARRAS HORIZONTAL
    const horizontalBarOptions = {
        indexAxis: 'y' as const, // Define o eixo principal como Y (horizontal)
        responsive: true,
        plugins: {
            legend: {
                display: false, // Esconde a legenda, pois as cores são decorativas
            },
            title: {
                display: false,
            },
        },
    };


    if (loading) {
        return <p className="text-center text-texto-secundario p-10">A carregar dados do Dashboard...</p>;
    }

    if (error) {
        return (
            <div className="bg-red-100 text-erro p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Ocorreu um Erro</h2>
                <p>{error}</p>
                <Button onClick={fetchDashboardData} className="mt-4 w-auto">Tentar Novamente</Button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Dashboard de Análise</h1>
            </div>
            <div className="bg-fundo-secundario p-4 rounded-lg shadow-sm mb-8 border border-borda">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-auto">
                        <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                    <div className="flex-grow">
                        <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                    <div className="w-full md:w-auto">
                        <Button onClick={fetchDashboardData} disabled={loading} className="w-full !py-3 flex items-center justify-center gap-2">
                            <SearchIcon />
                            {loading ? 'A buscar...' : 'Filtrar'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-fundo-secundario p-6 rounded-lg shadow text-center mb-8 border border-borda">
                <p className="text-texto-secundario text-sm font-medium">Faturamento Total no Período</p>
                <p className="text-4xl font-bold text-green-600">{Number(analyticsData.faturamentoTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-fundo-secundario p-6 rounded-lg shadow relative border border-borda">
                    <ChartMenu onExportXLSX={() => exportToXLSX(analyticsData.faturamentoPorFormaPagamento || [], 'faturamento_por_forma_pagamento')} />
                    <h2 className="text-xl font-bold text-texto-principal mb-4">Recebidos por Forma de Pagamento</h2>
                    <Doughnut data={pagamentosData} />
                </div>
                <div className="bg-fundo-secundario p-6 rounded-lg shadow relative border border-borda">
                    <ChartMenu onExportXLSX={() => exportToXLSX(analyticsData.orcamentosAprovados || [], 'orcamentos_aprovados_por_dia')} />
                    <h2 className="text-xl font-bold text-texto-principal mb-4">Orçamentos Aprovados por Dia</h2>
                    <Line data={orcamentosData} />
                </div>
                <div className="bg-fundo-secundario p-6 rounded-lg shadow relative border border-borda">
                    <ChartMenu onExportXLSX={() => exportToXLSX(analyticsData.servicosPorFuncionario || [], 'servicos_por_funcionario')} />
                    <h2 className="text-xl font-bold text-texto-principal mb-4">Serviços por Funcionário</h2>
                    <Bar data={funcionariosData} />
                </div>
                <div className="bg-fundo-secundario p-6 rounded-lg shadow relative border border-borda">
                    <ChartMenu onExportXLSX={() => exportToXLSX(analyticsData.topServicos || [], 'top_5_servicos')} />
                    <h2 className="text-xl font-bold text-texto-principal mb-4">Top 5 Serviços Mais Realizados</h2>
                    {/* ✅ GRÁFICO ALTERADO DE <Doughnut> PARA <Bar> COM OPÇÕES HORIZONTAIS */}
                    <Bar options={horizontalBarOptions} data={topServicosData} />
                </div>
            </div>
        </div>
    );
}