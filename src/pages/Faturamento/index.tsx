import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import * as XLSX from 'xlsx';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Interfaces
interface DetalheFaturamento {
    agendamento_id: string;
    data_hora_inicio: string;
    servico_nome: string;
    servico_preco: string;
    cliente_nome: string;
    funcionario_nome: string | null;
}

interface RelatorioFaturamento {
    detalhes: DetalheFaturamento[];
    total: number;
}

export default function FaturamentoPage() {
    const [relatorio, setRelatorio] = useState<RelatorioFaturamento | null>(null);
    const [loading, setLoading] = useState(false);
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

    // A lógica de filtro por serviço específico seria adicionada na Cloud Function
    const [servicoId, setServicoId] = useState('');

    const handleBuscarRelatorio = async () => {
        setLoading(true);
        setRelatorio(null);
        try {
            // ✅ Lógica refatorada para chamar uma Cloud Function
            const functions = getFunctions();
            const getFaturamento = httpsCallable(functions, 'getFaturamento');

            const response: any = await getFaturamento({
                data_inicio: dataInicio,
                data_fim: dataFim,
                servico_id: servicoId || null
            });

            setRelatorio(response.data);
        } catch (error) {
            console.error("Erro ao buscar relatório de faturamento:", error);
            alert('Erro ao buscar relatório de faturamento.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportarPlanilha = () => {
        if (!relatorio || relatorio.detalhes.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }
        const dadosFormatados = relatorio.detalhes.map(item => ({
            'Data e Hora': new Date(item.data_hora_inicio).toLocaleString('pt-BR'),
            'Cliente': item.cliente_nome,
            'Serviço': item.servico_nome,
            'Funcionário': item.funcionario_nome || 'Não associado',
            'Valor (R$)': parseFloat(item.servico_preco)
        }));
        const totalRow = { 'Cliente': 'TOTAL', 'Valor (R$)': relatorio.total };
        const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
        XLSX.utils.sheet_add_json(worksheet, [totalRow], { origin: -1, skipHeader: true });
        worksheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturamento');
        XLSX.writeFile(workbook, `relatorio-faturamento-${dataInicio}-a-${dataFim}.xlsx`);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Relatório de Faturamento</h1>

            <div className="bg-fundo-secundario p-4 rounded-lg shadow-sm mb-8 border border-borda">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-auto">
                        <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                    <div className="w-full md:w-auto">
                        <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                    <div className="flex-grow">
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Filtrar por Serviço (Opcional)</label>
                        <select value={servicoId} onChange={e => setServicoId(e.target.value)} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="">Todos os serviços</option>
                            {/* A lista de serviços viria do Firestore */}
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <Button onClick={handleBuscarRelatorio} disabled={loading} className="w-full">
                            {loading ? 'A buscar...' : 'Buscar'}
                        </Button>
                    </div>
                </div>
            </div>

            {relatorio && (
                <div className="bg-fundo-secundario rounded-lg p-6 shadow-sm border border-borda">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-2xl font-bold text-texto-principal">Total Faturado: <span className="text-green-600">{relatorio.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></h2>
                        <Button onClick={handleExportarPlanilha} variant="secondary" className="w-full md:w-auto">
                            Exportar para Planilha
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-borda bg-fundo-principal">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data/Hora</th>
                                    <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Cliente</th>
                                    <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Serviço</th>
                                    <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Funcionário</th>
                                    <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Preço</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-borda">
                                {relatorio.detalhes.map((item) => (
                                    <tr key={item.agendamento_id} className="hover:bg-fundo-principal">
                                        <td className="p-4 text-texto-secundario">{new Date(item.data_hora_inicio).toLocaleString('pt-BR')}</td>
                                        <td className="p-4 text-texto-principal">{item.cliente_nome}</td>
                                        <td className="p-4 text-texto-principal">{item.servico_nome}</td>
                                        <td className="p-4 text-texto-secundario">{item.funcionario_nome || 'N/A'}</td>
                                        <td className="p-4 text-texto-principal font-medium">{parseFloat(item.servico_preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}