import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebaseConfig';

interface Produto { id: string; nome: string; }
interface Movimentacao {
    data_movimento: { toDate: () => Date };
    produto_nome: string;
    tipo: string;
    quantidade: number;
    observacao: string | null;
    agendamento_id: string | null;
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function AuditoriaEstoquePage() {
    const { user } = useAuth();
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));
    const [produtoId, setProdutoId] = useState('todos');

    useEffect(() => {
        const fetchProdutos = async () => {
            if (!user) return;
            const produtosRef = collection(db, 'produtos');
            const q = query(produtosRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            setProdutos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto)));
        };
        fetchProdutos();
    }, [user]);

    const fetchAuditoria = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const functions = getFunctions();
            const getAuditoriaEstoque = httpsCallable(functions, 'getAuditoriaEstoque');

            const response: any = await getAuditoriaEstoque({
                data_inicio: dataInicio,
                data_fim: dataFim,
                produto_id: produtoId === 'todos' ? null : produtoId
            });

            setMovimentacoes(response.data);
        } catch (error) {
            console.error("Erro ao buscar auditoria:", error);
            alert('Erro ao buscar auditoria de estoque.');
        } finally {
            setLoading(false);
        }
    }, [user, dataInicio, dataFim, produtoId]);

    useEffect(() => {
        fetchAuditoria();
    }, [fetchAuditoria]);

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Auditoria de Estoque</h1>

            <div className="bg-fundo-secundario p-4 rounded-lg shadow-sm mb-8 border border-borda">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-auto">
                        <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                    <div className="w-full md:w-auto">
                        <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                    <div className="flex-grow">
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Produto</label>
                        <select value={produtoId} onChange={e => setProdutoId(e.target.value)} className="w-full px-4 py-3 bg-white border border-borda rounded-lg focus:ring-2 focus:ring-primaria-escuro focus:outline-none transition duration-200">
                            <option value="todos">Todos os Produtos</option>
                            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <Button onClick={fetchAuditoria} disabled={loading}>{loading ? 'A buscar...' : 'Filtrar'}</Button>
                    </div>
                </div>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Produto</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Tipo</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Qtd.</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Observação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {movimentacoes.map((item, index) => (
                            <tr key={index} className="hover:bg-fundo-principal">
                                <td className="p-4 text-texto-secundario">{item.data_movimento.toDate().toLocaleString('pt-BR')}</td>
                                <td className="p-4 text-texto-principal font-medium">{item.produto_nome}</td>
                                <td className="p-4 text-texto-secundario">{item.tipo}</td>
                                <td className={`p-4 font-bold ${item.quantidade > 0 ? 'text-green-600' : 'text-red-500'}`}>{item.quantidade > 0 ? `+${item.quantidade}` : item.quantidade}</td>
                                <td className="p-4 text-texto-secundario">{item.observacao || (item.agendamento_id ? `Ref. OS #${item.agendamento_id.substring(0, 6)}` : '-')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}