import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Bar } from 'react-chartjs-2';
import { FaBrain } from 'react-icons/fa'; // Importe o ícone

const IconBrain = FaBrain as React.ElementType;

interface DREData {
    receitaBrutaServicos: number;
    receitaBrutaProdutos: number;
    receitaBrutaTotal: number;
    impostosSobreVendas: number;
    receitaLiquida: number;
    custoServicos: number;
    custoProdutos: number;
    custosTotais: number;
    lucroBruto: number;
    despesasComissoes: number;
    despesasOperacionais: number;
    lucroLiquido: number;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function DREPage() {
    const [dreData, setDreData] = useState<DREData | null>(null);
    const [loading, setLoading] = useState(false);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));

    // --- NOVOS ESTADOS PARA A ANÁLISE DE IA ---
    const [analiseIA, setAnaliseIA] = useState('');
    const [loadingIA, setLoadingIA] = useState(false);

    const fetchDRE = useCallback(async () => {
        setLoading(true);
        setAnaliseIA(''); // Limpa a análise anterior ao buscar novos dados
        try {
            const params = { data_inicio: dataInicio, data_fim: dataFim };
            const response = await api.get('/relatorios/dre', { params });
            setDreData(response.data);
        } catch (error) {
            alert('Erro ao buscar o DRE.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim]);

    useEffect(() => {
        fetchDRE();
    }, [fetchDRE]);

    // --- FUNÇÃO PARA CHAMAR A IA ---
    const handleAnalisarComIA = async () => {
        if (!dreData) return;
        setLoadingIA(true);
        setAnaliseIA('');
        try {
            const response = await api.post('/inteligencia/analisar-dre', { dreData });
            setAnaliseIA(response.data.analise);
        } catch (error) {
            alert('Erro ao gerar análise com IA.');
        } finally {
            setLoadingIA(false);
        }
    };

    const chartData = {
        labels: ['Receita Bruta', 'Custos', 'Despesas', 'Lucro Líquido'],
        datasets: [{
            label: 'Resultado (R$)',
            data: [
                dreData?.receitaBrutaTotal || 0,
                dreData?.custosTotais || 0,
                dreData?.despesasOperacionais || 0,
                dreData?.lucroLiquido || 0,
            ],
            backgroundColor: ['#3B82F6', '#EF4444', '#F59E0B', '#10B981'],
        }],
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Demonstrativo de Resultado (DRE Gerencial)</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-fundo-secundario rounded-lg">
                <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                <div className="flex items-end"><Button onClick={fetchDRE} disabled={loading}>{loading ? 'A calcular...' : 'Aplicar Filtros'}</Button></div>
            </div>

            {dreData && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-fundo-secundario p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Estrutura do Resultado</h2>
                            <button
                                onClick={handleAnalisarComIA}
                                disabled={loadingIA}
                                className="w-auto text-sm py-2 px-4 flex items-center gap-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IconBrain />
                                {loadingIA ? 'A analisar...' : 'Analisar com IA'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            <DRELine label="(+) Receita Bruta de Serviços" value={formatCurrency(dreData.receitaBrutaServicos)} />
                            <DRELine label="(+) Receita Bruta de Produtos" value={formatCurrency(dreData.receitaBrutaProdutos)} />
                            <DRELine label="(=) RECEITA OPERACIONAL BRUTA" value={formatCurrency(dreData.receitaBrutaTotal)} isTotal />
                            <hr className="border-borda my-3" />
                            <DRELine label="(-) Impostos sobre Vendas (Simulação)" value={formatCurrency(dreData.impostosSobreVendas)} isNegative />
                            <DRELine label="(=) RECEITA OPERACIONAL LÍQUIDA" value={formatCurrency(dreData.receitaLiquida)} isTotal />
                            <hr className="border-borda my-3" />
                            <DRELine label="(-) Custo dos Serviços Prestados (CSP)" value={formatCurrency(dreData.custoServicos)} isNegative />
                            <DRELine label="(-) Custo das Mercadorias Vendidas (CMV)" value={formatCurrency(dreData.custoProdutos)} isNegative />
                            <DRELine label="(=) LUCRO BRUTO" value={formatCurrency(dreData.lucroBruto)} isTotal />
                            <hr className="border-borda my-3" />
                            <DRELine label="(-) Despesas com Comissões" value={formatCurrency(dreData.despesasComissoes)} isNegative />
                            <DRELine label="(=) LUCRO LÍQUIDO OPERACIONAL" value={formatCurrency(dreData.lucroLiquido)} isTotal finalValue={dreData.lucroLiquido} />
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-fundo-secundario p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Visão Geral</h2>
                        <Bar data={chartData} options={{ indexAxis: 'y' }} />
                    </div>

                    {/* --- SECÇÃO PARA EXIBIR A ANÁLISE DA IA --- */}
                    {(loadingIA || analiseIA) && (
                        <div className="lg:col-span-5 bg-fundo-secundario p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><IconBrain /> Análise da Inteligência Artificial</h2>
                            {loadingIA ? (
                                <p className="text-texto-secundario">A IA está a processar os dados e a gerar insights para você...</p>
                            ) : (
                                <div className="prose prose-invert text-texto-principal" dangerouslySetInnerHTML={{ __html: analiseIA }} />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const DRELine = ({ label, value, isTotal = false, isNegative = false, finalValue }: any) => {
    const valueColor = finalValue ? (finalValue >= 0 ? 'text-green-500' : 'text-red-500') : (isNegative ? 'text-red-400' : 'text-texto-principal');
    const labelStyle = isTotal ? 'font-bold text-white' : 'text-texto-secundario';
    return (
        <div className="flex justify-between items-center text-sm py-1">
            <p className={labelStyle}>{label}</p>
            <p className={`font-mono ${isTotal ? 'font-bold' : ''} ${valueColor}`}>{value}</p>
        </div>
    );
};