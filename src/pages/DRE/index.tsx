import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Bar } from 'react-chartjs-2';
import { FaBrain } from 'react-icons/fa';
import { getFunctions, httpsCallable } from 'firebase/functions';

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

const formatCurrency = (value: number) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function DREPage() {
    const [dreData, setDreData] = useState<DREData | null>(null);
    const [loading, setLoading] = useState(false);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));
    const [analiseIA, setAnaliseIA] = useState('');
    const [loadingIA, setLoadingIA] = useState(false);

    const fetchDRE = useCallback(async () => {
        setLoading(true);
        setAnaliseIA('');
        try {
            const functions = getFunctions();
            const getDRE = httpsCallable(functions, 'getDRE');
            const response: any = await getDRE({ data_inicio: dataInicio, data_fim: dataFim });
            setDreData(response.data);
        } catch (error) {
            console.error("Erro ao buscar DRE via Cloud Function:", error);
            alert('Erro ao buscar o DRE.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim]);

    useEffect(() => {
        fetchDRE();
    }, [fetchDRE]);

    const handleAnalisarComIA = async () => {
        if (!dreData) return;
        setLoadingIA(true);
        setAnaliseIA('');
        try {
            const functions = getFunctions();
            const analisarDRE = httpsCallable(functions, 'analisarDRE');
            const response: any = await analisarDRE({ dreData });
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
            backgroundColor: ['#420b58', '#fc036c', '#f1a20b', '#08807b'],
        }],
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Demonstrativo de Resultado (DRE Gerencial)</h1>
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
                        <Button onClick={fetchDRE} disabled={loading} className="w-full">{loading ? 'A calcular...' : 'Aplicar Filtros'}</Button>
                    </div>
                </div>
            </div>

            {dreData && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-fundo-secundario p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-texto-principal">Estrutura do Resultado</h2>
                            <button
                                onClick={handleAnalisarComIA}
                                disabled={loadingIA}
                                className="w-auto text-sm py-2 px-4 flex items-center gap-2 bg-primaria-escuro text-white font-semibold rounded-lg shadow-md hover:bg-primaria-padrao transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="lg:col-span-2 bg-fundo-secundario p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold text-texto-principal mb-4">Visão Geral</h2>
                        <Bar data={chartData} options={{ indexAxis: 'y' }} />
                    </div>

                    {(loadingIA || analiseIA) && (
                        <div className="lg:col-span-5 bg-fundo-secundario p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold text-texto-principal mb-4 flex items-center gap-2"><IconBrain /> Análise da Inteligência Artificial</h2>
                            {loadingIA ? (
                                <p className="text-texto-secundario">A IA está a processar os dados e a gerar insights para você...</p>
                            ) : (
                                <div className="prose max-w-none text-texto-secundario" dangerouslySetInnerHTML={{ __html: analiseIA }} />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const DRELine = ({ label, value, isTotal = false, isNegative = false, finalValue }: any) => {
    const valueColor = finalValue ? (finalValue >= 0 ? 'text-green-600' : 'text-erro') : (isNegative ? 'text-red-500' : 'text-texto-principal');
    const labelStyle = isTotal ? 'font-bold text-texto-principal' : 'text-texto-secundario';
    return (
        <div className="flex justify-between items-center text-sm py-1">
            <p className={labelStyle}>{label}</p>
            <p className={`font-mono ${isTotal ? 'font-bold' : ''} ${valueColor}`}>{value}</p>
        </div>
    );
};