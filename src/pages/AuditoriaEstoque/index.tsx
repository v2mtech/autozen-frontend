import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface Produto { id: number; nome: string; }
interface Movimentacao {
    data_movimento: string;
    produto_nome: string;
    tipo: string;
    quantidade: number;
    observacao: string | null;
    agendamento_id: number | null;
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function AuditoriaEstoquePage() {
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));
    const [produtoId, setProdutoId] = useState('todos');

    useEffect(() => {
        api.get('/produtos').then(res => setProdutos(res.data));
    }, []);

    const fetchAuditoria = useCallback(async () => {
        setLoading(true);
        try {
            const params = { data_inicio: dataInicio, data_fim: dataFim, produto_id: produtoId };
            const response = await api.get('/relatorios/auditoria-estoque', { params });
            setMovimentacoes(response.data);
        } catch (error) {
            alert('Erro ao buscar auditoria de estoque.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim, produtoId]);

    useEffect(() => {
        fetchAuditoria();
    }, [fetchAuditoria]);

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Auditoria de Estoque</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-fundo-secundario rounded-lg">
                <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2">Produto</label>
                    <select value={produtoId} onChange={e => setProdutoId(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg">
                        <option value="todos">Todos</option>
                        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                </div>
                <div className="flex items-end"><Button onClick={fetchAuditoria} disabled={loading}>{loading ? 'A buscar...' : 'Filtrar'}</Button></div>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700"><tr><th className="p-4">Data</th><th className="p-4">Produto</th><th className="p-4">Tipo</th><th className="p-4">Qtd.</th><th className="p-4">Observação</th></tr></thead>
                    <tbody>
                        {movimentacoes.map((item, index) => (
                            <tr key={index} className="border-b border-gray-700">
                                <td className="p-4">{new Date(item.data_movimento).toLocaleString('pt-BR')}</td>
                                <td className="p-4">{item.produto_nome}</td>
                                <td className="p-4">{item.tipo}</td>
                                <td className={`p-4 font-bold ${item.quantidade > 0 ? 'text-green-500' : 'text-red-500'}`}>{item.quantidade}</td>
                                <td className="p-4">{item.observacao || (item.agendamento_id ? `Ref. OS #${item.agendamento_id}`: '-')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}