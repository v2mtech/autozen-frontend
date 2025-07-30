import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Interfaces
interface Servico { id: string; nome: string; preco: number; }
interface Produto { id: string; nome: string; preco_venda: number; }
interface CondicaoPagamento { id: string; nome: string; }
interface Orcamento {
    id: string;
    descricao: string;
    notas_funcionario: string;
    valor_total: number;
    servicos_selecionados: Servico[];
    produtos_selecionados: Produto[];
    condicao_pagamento_id: string | null;
    imagens: string[]; // Array de URLs
    status: 'solicitado' | 'em analise' | 'aguardando cliente' | 'aprovado' | 'cancelado' | 'devolvido';
}

export default function OrcamentoDetalhePage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orcamento, setOrcamento] = useState<Partial<Orcamento>>({
        servicos_selecionados: [],
        produtos_selecionados: [],
    });
    const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
    const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
    const [condicoes, setCondicoes] = useState<CondicaoPagamento[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user) return;
            try {
                const orcamentoRef = doc(db, 'orcamentos', id);
                const orcamentoSnap = await getDoc(orcamentoRef);
                if (orcamentoSnap.exists()) {
                    setOrcamento({ id: orcamentoSnap.id, ...orcamentoSnap.data() });
                }

                const servicosRef = collection(db, 'servicos');
                const qServicos = query(servicosRef, where("empresa_id", "==", user.uid));
                const servicosSnap = await getDocs(qServicos);
                setServicosDisponiveis(servicosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Servico)));

                const produtosRef = collection(db, 'produtos');
                const qProdutos = query(produtosRef, where("empresa_id", "==", user.uid));
                const produtosSnap = await getDocs(qProdutos);
                setProdutosDisponiveis(produtosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto)));

                const condRef = collection(db, 'condicoes_pagamento');
                const qCond = query(condRef, where("empresa_id", "==", user.uid));
                const condSnap = await getDocs(qCond);
                setCondicoes(condSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CondicaoPagamento)));

            } catch (error) {
                alert("Erro ao carregar dados do orçamento.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const isLocked = orcamento.status === 'aprovado' || orcamento.status === 'cancelado';

    const handleAddItem = (type: 'servico' | 'produto', itemId: string) => {
        if (!itemId || isLocked) return;
        let selectedItem: Servico | Produto | undefined;
        if (type === 'servico') {
            selectedItem = servicosDisponiveis.find(item => item.id === itemId);
            if (selectedItem && !orcamento.servicos_selecionados?.find(i => i.id === selectedItem?.id)) {
                setOrcamento(prev => ({ ...prev, servicos_selecionados: [...(prev.servicos_selecionados || []), selectedItem as Servico] }));
            }
        } else {
            selectedItem = produtosDisponiveis.find(item => item.id === itemId);
            if (selectedItem && !orcamento.produtos_selecionados?.find(i => i.id === selectedItem?.id)) {
                setOrcamento(prev => ({ ...prev, produtos_selecionados: [...(prev.produtos_selecionados || []), selectedItem as Produto] }));
            }
        }
    };

    const handleRemoveItem = (type: 'servico' | 'produto', itemId: string) => {
        if (isLocked) return;
        if (type === 'servico') {
            setOrcamento(prev => ({ ...prev, servicos_selecionados: prev.servicos_selecionados?.filter(item => item.id !== itemId) }));
        } else {
            setOrcamento(prev => ({ ...prev, produtos_selecionados: prev.produtos_selecionados?.filter(item => item.id !== itemId) }));
        }
    };

    const valorTotal = useMemo(() => {
        const totalServicos = orcamento.servicos_selecionados?.reduce((acc, item) => acc + Number(item.preco), 0) || 0;
        const totalProdutos = orcamento.produtos_selecionados?.reduce((acc, item) => acc + Number(item.preco_venda), 0) || 0;
        return totalServicos + totalProdutos;
    }, [orcamento.servicos_selecionados, orcamento.produtos_selecionados]);

    const handleSave = async () => {
        // ✅ INÍCIO DA CORREÇÃO
        // O 'id' do documento vem da URL (useParams), que já é verificado.
        // O 'id' de dentro do objeto de estado não deve ser gravado de volta no Firestore.
        if (!id || isLocked) return;

        const { id: orcamentoIdFromState, ...dataToUpdate } = orcamento;

        const dataToSend = {
            ...dataToUpdate,
            valor_total: valorTotal,
            status: 'aguardando cliente'
        };
        // ✅ FIM DA CORREÇÃO

        try {
            const orcamentoRef = doc(db, 'orcamentos', id);
            await updateDoc(orcamentoRef, dataToSend);
            alert('Orçamento enviado para o cliente com sucesso!');
            navigate('/orcamentos-kanban');
        } catch (error) {
            alert('Erro ao guardar o orçamento.');
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar orçamento...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-texto-principal">Detalhes do Orçamento #{id?.substring(0, 6)}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg border border-borda">
                        <h2 className="text-xl font-semibold mb-2 text-texto-principal">Solicitação do Cliente</h2>
                        <p className="text-texto-secundario">{orcamento.descricao}</p>
                        {orcamento.imagens && orcamento.imagens.length > 0 && (
                            <div className="flex gap-4 mt-4 overflow-x-auto">
                                {orcamento.imagens.map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noreferrer">
                                        <img src={url} alt="Anexo do cliente" className="w-24 h-24 object-cover rounded-md border border-borda" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg border border-borda">
                        <h2 className="text-xl font-semibold mb-4 text-texto-principal">Itens do Orçamento</h2>
                        {!isLocked && (
                            <div className="flex flex-col md:flex-row gap-2 mb-4">
                                <select onChange={e => handleAddItem('servico', e.target.value)} disabled={isLocked} className="flex-1 p-2 border rounded-lg bg-white disabled:bg-gray-200">
                                    <option value="">Adicionar Serviço</option>
                                    {servicosDisponiveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                </select>
                                <select onChange={e => handleAddItem('produto', e.target.value)} disabled={isLocked} className="flex-1 p-2 border rounded-lg bg-white disabled:bg-gray-200">
                                    <option value="">Adicionar Produto</option>
                                    {produtosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>
                        )}
                        <ul className="space-y-2">
                            {orcamento.servicos_selecionados?.map(s => (
                                <li key={`s-${s.id}`} className="flex justify-between items-center bg-fundo-principal p-2 rounded">
                                    <span className="text-texto-principal">{s.nome} - {Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    {!isLocked && (<button onClick={() => handleRemoveItem('servico', s.id)} className="text-erro hover:opacity-75 font-bold text-lg px-2">&times;</button>)}
                                </li>
                            ))}
                            {orcamento.produtos_selecionados?.map(p => (
                                <li key={`p-${p.id}`} className="flex justify-between items-center bg-fundo-principal p-2 rounded">
                                    <span className="text-texto-principal">{p.nome} - {Number(p.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    {!isLocked && (<button onClick={() => handleRemoveItem('produto', p.id)} className="text-erro hover:opacity-75 font-bold text-lg px-2">&times;</button>)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg border border-borda sticky top-6">
                        <h2 className="text-xl font-semibold mb-4 text-texto-principal">Finalização</h2>
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Notas para o Cliente</label>
                            <textarea value={orcamento.notas_funcionario || ''} onChange={e => setOrcamento({ ...orcamento, notas_funcionario: e.target.value })} disabled={isLocked} className="w-full p-2 border border-borda rounded-lg bg-white disabled:bg-gray-200 text-texto-principal" rows={4}></textarea>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Condição de Pagamento</label>
                            <select value={orcamento.condicao_pagamento_id || ''} onChange={e => setOrcamento({ ...orcamento, condicao_pagamento_id: e.target.value })} disabled={isLocked} className="w-full p-2 border border-borda rounded-lg bg-white disabled:bg-gray-200 text-texto-principal">
                                <option value="">Selecione...</option>
                                {condicoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div className="mt-6 border-t border-borda pt-4">
                            <p className="text-texto-secundario">Valor Total do Orçamento</p>
                            <p className="text-3xl font-bold text-primaria-padrao">{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </div>
                    {isLocked && (
                        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-center text-sm font-semibold">
                            Este orçamento já foi <strong>{orcamento.status}</strong> e não pode mais ser editado.
                        </div>
                    )}
                    <div className="space-y-2">
                        <Button onClick={handleSave} variant="primary" disabled={isLocked}>
                            {isLocked ? `Orçamento ${orcamento.status}` : 'Guardar e Enviar para Cliente'}
                        </Button>
                        <Button onClick={() => navigate('/orcamentos-kanban')} variant="secondary">Voltar</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}