import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';

interface EstoqueItem {
    id: number;
    nome: string;
    codigo_interno: string;
    estoque_minimo: number;
    quantidade_atual: number;
}
interface AjusteEstoque {
    produto_id: number | null;
    quantidade: number;
    tipo: 'entrada_manual' | 'saida_manual';
    observacao: string;
}

export default function EstoquePage() {
    const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ajuste, setAjuste] = useState<AjusteEstoque>({ produto_id: null, quantidade: 0, tipo: 'entrada_manual', observacao: '' });
    const [produtoSelecionado, setProdutoSelecionado] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchEstoque = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/estoque');
            setEstoque(response.data);
        } catch (error) {
            alert('Erro ao carregar o estoque.');
        } finally {
            setLoading(false);
        }
    }, []);

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
            await api.post('/estoque/ajustar', { ...ajuste, quantidade: quantidadeFinal });
            setIsModalOpen(false);
            fetchEstoque();
        } catch (error) {
            alert('Erro ao ajustar o estoque.');
        }
    };

    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Controlo de Estoque</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700"><tr><th className="p-4">Produto</th><th className="p-4">Stock Mínimo</th><th className="p-4">Stock Atual</th><th className="p-4">Ações</th></tr></thead>
                    <tbody>
                        {estoque.map(item => (
                            <tr key={item.id} className={`border-b border-gray-700 ${item.quantidade_atual <= item.estoque_minimo ? 'bg-red-500/10' : ''}`}>
                                <td className="p-4 font-semibold">{item.nome}</td>
                                <td className="p-4">{item.estoque_minimo}</td>
                                <td className="p-4 font-bold">{item.quantidade_atual}</td>
                                <td className="p-4"><Button onClick={() => handleOpenModal(item)} className="w-auto text-xs py-1 px-3">Ajustar</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Ajustar Estoque de ${produtoSelecionado}`}>
                <div className="space-y-4">
                    <Input label="Quantidade" type="number" value={ajuste.quantidade.toString()} onChange={e => setAjuste(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}/>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo de Movimentação</label>
                        <select value={ajuste.tipo} onChange={e => setAjuste(prev => ({...prev, tipo: e.target.value as any}))} className="w-full p-2 border rounded-lg bg-white">
                            <option value="entrada_manual">Entrada Manual</option>
                            <option value="saida_manual">Saída Manual (Perda/Quebra)</option>
                        </select>
                    </div>
                    <Input label="Observação (Opcional)" value={ajuste.observacao} onChange={e => setAjuste(prev => ({...prev, observacao: e.target.value}))}/>
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t"><Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button><Button onClick={handleSaveAjuste}>Confirmar Ajuste</Button></div>
            </Modal>
        </div>
    );
}