import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebaseConfig';

// Interfaces
interface Servico { id: string; nome: string; preco: string; }
interface Produto { id: string; nome: string; preco_venda: number; }
interface Funcionario { id: string; nome: string; }
interface OrdemServico {
    id: string;
    data_hora_inicio: { toDate: () => Date };
    status: string;
    usuario_nome: string;
    funcionario_id: string | null;
    servicos: Servico[];
    produtos: Produto[];
    // Adicione outros campos necessários
}
interface Checklist { id: string; data_checkin: any; data_checkout: any; }
interface FormaPagamento { id: string; nome: string; }
interface CondicaoPagamento { id: string; nome: string; }

const statusOptions = ['agendado', 'em andamento', 'aguardando cliente', 'aguardando peça', 'concluido', 'cancelado'];

export default function OrdemDeServicoEmpresaPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [os, setOs] = useState<Partial<OrdemServico>>({});
    const [originalStatus, setOriginalStatus] = useState<string | null>(null);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [checklist, setChecklist] = useState<Checklist | null>(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
    const [condicoesPagamento, setCondicoesPagamento] = useState<CondicaoPagamento[]>([]);
    const [selectedFormaPagamento, setSelectedFormaPagamento] = useState('');
    const [selectedCondicaoPagamento, setSelectedCondicaoPagamento] = useState('');

    const fetchInitialData = useCallback(async () => {
        if (!id || !user) return;
        setLoading(true);
        try {
            const osRef = doc(db, 'agendamentos', id);
            const osSnap = await getDoc(osRef);
            if (osSnap.exists()) {
                const data = { id: osSnap.id, ...osSnap.data() } as OrdemServico;
                setOs(data);
                setOriginalStatus(data.status);
            }

            const funcRef = collection(db, 'funcionarios');
            const qFunc = query(funcRef, where("empresa_id", "==", user.uid));
            const funcSnap = await getDocs(qFunc);
            setFuncionarios(funcSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funcionario)));

            // Lógica similar para buscar formas e condições de pagamento
            const formasRef = collection(db, 'formas_pagamento');
            const qFormas = query(formasRef, where("empresa_id", "==", user.uid));
            const formasSnap = await getDocs(qFormas);
            setFormasPagamento(formasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormaPagamento)));

            const condRef = collection(db, 'condicoes_pagamento');
            const qCond = query(condRef, where("empresa_id", "==", user.uid));
            const condSnap = await getDocs(qCond);
            setCondicoesPagamento(condSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CondicaoPagamento)));


        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleSalvarOS = async () => {
        if (!os || !os.id) return;
        if (os.status === 'concluido' && originalStatus !== 'concluido') {
            setIsPaymentModalOpen(true);
            return;
        }
        try {
            const osRef = doc(db, 'agendamentos', os.id);
            await updateDoc(osRef, {
                status: os.status,
                funcionario_id: os.funcionario_id || null
            });
            alert('Ordem de Serviço salva com sucesso!');
            navigate('/kanban');
        } catch (err) {
            alert('Erro ao salvar a Ordem de Serviço.');
        }
    };

    const handleFinalizarPagamento = async () => {
        if (!os || !os.id || !selectedFormaPagamento || !selectedCondicaoPagamento) {
            alert('Por favor, selecione a forma e a condição de pagamento.');
            return;
        }
        try {
            // Esta lógica complexa deve ser uma Cloud Function
            const functions = getFunctions();
            const finalizarOS = httpsCallable(functions, 'finalizarOS');
            await finalizarOS({
                agendamentoId: os.id,
                forma_pagamento_id: selectedFormaPagamento,
                condicao_pagamento_id: selectedCondicaoPagamento
            });

            alert('Ordem de Serviço finalizada com sucesso!');
            setIsPaymentModalOpen(false);
            setOriginalStatus('concluido');
            setOs(prev => ({ ...prev, status: 'concluido' }));
        } catch (err: any) {
            alert('Erro ao finalizar a Ordem de Serviço.');
        }
    };

    const totalOS = useMemo(() => {
        if (!os) return 0;
        const totalServicos = os.servicos?.reduce((acc, item) => acc + parseFloat(item.preco || '0'), 0) || 0;
        const totalProdutos = os.produtos?.reduce((acc, item) => acc + parseFloat(String(item.preco_venda) || '0'), 0) || 0;
        return totalServicos + totalProdutos;
    }, [os]);

    if (loading) return <p className="text-center">Carregando...</p>;
    if (!os.id) return <p className="text-center">Ordem de Serviço não encontrada.</p>;

    const isLocked = originalStatus === 'concluido' || originalStatus === 'cancelado';

    return (
        <div className="p-4 md:p-6 bg-fundo-principal">
            <h1 className="text-3xl font-bold mb-4 text-texto-principal">Ordem de Serviço #{os.id?.substring(0, 6)}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                        <h2 className="text-xl font-semibold mb-4 text-texto-principal">Cliente e Agendamento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm text-texto-secundario">Cliente</label><p className="font-bold text-lg">{os.usuario_nome}</p></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                        <h3 className="text-lg font-semibold mb-4 text-texto-principal">Status e Atribuição</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="status" className="text-sm font-semibold text-texto-secundario block mb-2">Status da O.S.</label>
                                <select id="status" value={os.status} onChange={e => setOs({ ...os, status: e.target.value })} className="w-full px-4 py-2 bg-white border border-borda rounded-lg disabled:bg-gray-200" disabled={isLocked}>
                                    {statusOptions.map(opt => <option key={opt} value={opt} className="capitalize">{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="executor" className="text-sm font-semibold text-texto-secundario block mb-2">Executor</label>
                                <select id="executor" value={os.funcionario_id || ''} onChange={e => setOs({ ...os, funcionario_id: e.target.value || null })} className="w-full px-4 py-2 bg-white border border-borda rounded-lg disabled:bg-gray-200" disabled={isLocked}>
                                    <option value="">Nenhum</option>
                                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {!isLocked && (<Button onClick={handleSalvarOS} variant="primary">Salvar O.S.</Button>)}
                        <Button onClick={() => navigate('/kanban')} variant="secondary">Voltar para o Quadro</Button>
                    </div>
                </div>
            </div>
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Finalizar e Registrar Pagamento">
                <div className="space-y-4 text-texto-principal">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-texto-secundario">Forma de Pagamento</label>
                        <select value={selectedFormaPagamento} onChange={e => setSelectedFormaPagamento(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option value="">Selecione...</option>{formasPagamento.map(fp => <option key={fp.id} value={fp.id}>{fp.nome}</option>)}</select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-texto-secundario">Condição de Pagamento</label>
                        <select value={selectedCondicaoPagamento} onChange={e => setSelectedCondicaoPagamento(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option value="">Selecione...</option>{condicoesPagamento.map(cp => <option key={cp.id} value={cp.id}>{cp.nome}</option>)}</select>
                    </div>
                </div>
                <div className="flex justify-end items-center gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsPaymentModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleFinalizarPagamento}>Confirmar Pagamento</Button>
                </div>
            </Modal>
        </div>
    );
}