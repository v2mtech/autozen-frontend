import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebaseConfig';

interface EstoqueItem {
    id: string; // ID do produto
    nome: string;
    codigo_interno: string;
    estoque_minimo: number;
    quantidade_atual: number;
}
interface AjusteEstoque {
    produto_id: string | null;
    quantidade: number;
    tipo: 'entrada_manual' | 'saida_manual';
    observacao: string;
}

export default function EstoquePage() {
    const { user } = useAuth();
    const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ajuste, setAjuste] = useState<AjusteEstoque>({ produto_id: null, quantidade: 0, tipo: 'entrada_manual', observacao: '' });
    const [produtoSelecionado, setProdutoSelecionado] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchEstoque = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Esta lógica pode ser complexa e idealmente seria uma Cloud Function
            // que junta os dados das coleções 'produtos' e 'estoque'.
            // Por simplicidade, vamos assumir uma busca apenas em 'produtos'.
            const produtosRef = collection(db, 'produtos');
            const q = query(produtosRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            const estoqueList = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    nome: data.nome,
                    codigo_interno: data.codigo_interno,
                    estoque_minimo: data.estoque_minimo,
                    quantidade_atual: data.quantidade_estoque || 0,
                } as EstoqueItem
            });
            setEstoque(estoqueList);
        } catch (error) {
            alert('Erro ao carregar o estoque.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchEstoque();
    }, [fetchEstoque]);

    const handleOpenModal = (produto: EstoqueItem) => {
        setAjuste({ produto_id: produto.id, quantidade: 0, tipo: 'entrada_manual', observacao: '' });
        setProdutoSelecionado(produto.nome);
        setIsModalOpen(true);
    };

    const handleSaveAjuste = async () => {
        if (!ajuste.produto_id || ajuste.quantidade === 0) {
            alert('A quantidade deve ser maior que zero.');
            return;
        }
        const quantidadeFinal = ajuste.tipo === 'saida_manual' ? -Math.abs(ajuste.quantidade) : Math.abs(ajuste.quantidade);

        try {
            const functions = getFunctions();
            const ajustarEstoque = httpsCallable(functions, 'ajustarEstoque');
            await ajustarEstoque({ ...ajuste, quantidade: quantidadeFinal });

            setIsModalOpen(false);
            fetchEstoque();
        } catch (error) {
            alert('Erro ao ajustar o estoque.');
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Controlo de Estoque</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-sm border border-borda overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-fundo-principal border-b border-borda">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Produto</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Stock Mínimo</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Stock Atual</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {estoque.map(item => (
                            <tr key={item.id} className={`${item.quantidade_atual <= item.estoque_minimo ? 'bg-red-500/10' : ''} hover:bg-fundo-principal`}>
                                <td className="p-4 font-semibold text-texto-principal">{item.nome}</td>
                                <td className="p-4 text-texto-secundario">{item.estoque_minimo}</td>
                                <td className="p-4 font-bold text-texto-principal">{item.quantidade_atual}</td>
                                <td className="p-4"><Button onClick={() => handleOpenModal(item)} className="w-auto !text-xs !py-1 !px-3">Ajustar</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Ajustar Estoque de ${produtoSelecionado}`}>
                <div className="space-y-4">
                    <Input label="Quantidade" type="number" value={ajuste.quantidade.toString()} onChange={e => setAjuste(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))} />
                    <div>
                        <label className="block text-sm font-semibold text-texto-secundario mb-2">Tipo de Movimentação</label>
                        <select value={ajuste.tipo} onChange={e => setAjuste(prev => ({ ...prev, tipo: e.target.value as any }))} className="w-full p-2 border rounded-lg bg-white">
                            <option value="entrada_manual">Entrada Manual</option>
                            <option value="saida_manual">Saída Manual (Perda/Quebra)</option>
                        </select>
                    </div>
                    <Input label="Observação (Opcional)" value={ajuste.observacao} onChange={e => setAjuste(prev => ({ ...prev, observacao: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda"><Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button><Button onClick={handleSaveAjuste}>Confirmar Ajuste</Button></div>
            </Modal>
        </div>
    );
}