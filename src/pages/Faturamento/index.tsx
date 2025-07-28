import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import * as XLSX from 'xlsx'; // Importa a biblioteca para exportar planilha

// Interfaces
interface Servico {
    id: number;
    nome: string;
}

interface DetalheFaturamento {
    agendamento_id: number;
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
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [relatorio, setRelatorio] = useState<RelatorioFaturamento | null>(null);
    const [loading, setLoading] = useState(false);

    // Estados dos filtros
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
    const [servicoId, setServicoId] = useState('');

    // Busca a lista de serviços para popular o filtro
    useEffect(() => {
        api.get<Servico[]>('/servicos').then(response => {
            setServicos(response.data);
        });
    }, []);

    const handleBuscarRelatorio = async () => {
        setLoading(true);
        setRelatorio(null);
        try {
            const params = new URLSearchParams({
                data_inicio: dataInicio,
                data_fim: dataFim,
            });
            if (servicoId) {
                params.append('servico_id', servicoId);
            }
            const response = await api.get<RelatorioFaturamento>(`/relatorios/faturamento?${params.toString()}`);
            setRelatorio(response.data);
        } catch (error) {
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

        const totalRow = {
            'Cliente': 'TOTAL',
            'Valor (R$)': relatorio.total
        };

        const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
        XLSX.utils.sheet_add_json(worksheet, [totalRow], { origin: -1, skipHeader: true });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturamento');

        // Formata as colunas
        worksheet['!cols'] = [
            { wch: 20 }, // Data e Hora
            { wch: 30 }, // Cliente
            { wch: 30 }, // Serviço
            { wch: 30 }, // Funcionário
            { wch: 15 }  // Valor
        ];

        XLSX.writeFile(workbook, `relatorio-faturamento-${dataInicio}-a-${dataFim}.xlsx`);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Relatório de Faturamento</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-fundo-secundario rounded-lg">
                <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2">Filtrar por Serviço</label>
                    <select value={servicoId} onChange={e => setServicoId(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg">
                        <option value="">Todos os serviços</option>
                        {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <Button onClick={handleBuscarRelatorio} disabled={loading} className="w-full">
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                </div>
            </div>

            {relatorio && (
                <div className="bg-fundo-secundario rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Total Faturado: <span className="text-green-400">{relatorio.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></h2>
                        <Button onClick={handleExportarPlanilha} variant="secondary" className="w-auto">
                            Exportar para Planilha
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-4">Data/Hora</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Serviço</th>
                                    <th className="p-4">Funcionário</th>
                                    <th className="p-4">Preço</th>
                                </tr>
                            </thead>
                            <tbody>
                                {relatorio.detalhes.map((item) => (
                                    <tr key={item.agendamento_id} className="border-b border-gray-700">
                                        <td className="p-4">{new Date(item.data_hora_inicio).toLocaleString('pt-BR')}</td>
                                        <td className="p-4">{item.cliente_nome}</td>
                                        <td className="p-4">{item.servico_nome}</td>
                                        <td className="p-4">{item.funcionario_nome || 'N/A'}</td>
                                        <td className="p-4">{parseFloat(item.servico_preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
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