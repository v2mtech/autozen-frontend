import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Interfaces
interface Orcamento {
    id: string; // ID do Firestore
    descricao: string;
    data_orcamento: { toDate: () => Date }; // Objeto de data do Firestore
    valor_total: number;
    status: 'solicitado' | 'em analise' | 'aguardando cliente' | 'aprovado' | 'cancelado' | 'devolvido';
    nome_empresa: string;
    empresa_id: string;
}

export default function MeusOrcamentosPage() {
    const { user } = useAuth();
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
    const [isAlteracaoModalOpen, setIsAlteracaoModalOpen] = useState(false);
    const [mensagemAlteracao, setMensagemAlteracao] = useState('');

    const fetchOrcamentos = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const orcamentosRef = collection(db, 'orcamentos');
            const q = query(orcamentosRef, where("usuario_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const orcamentosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orcamento));
            setOrcamentos(orcamentosList);
        } catch (error) {
            console.error("Erro ao carregar orçamentos:", error);
            alert('Não foi possível carregar os seus orçamentos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrcamentos();
    }, [user]);

    const handleOpenModal = (orcamento: Orcamento) => {
        setOrcamentoSelecionado(orcamento);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setOrcamentoSelecionado(null);
    };

    const handleActionSuccess = () => {
        handleCloseModal();
        fetchOrcamentos();
    };

    const handleOpenAlteracaoModal = (orcamento: Orcamento) => {
        setOrcamentoSelecionado(orcamento);
        setMensagemAlteracao('');
        setIsAlteracaoModalOpen(true);
    };

    const handleCloseAlteracaoModal = () => {
        setIsAlteracaoModalOpen(false);
        setOrcamentoSelecionado(null);
    };

    const handleEnviarSolicitacaoAlteracao = async () => {
        if (!orcamentoSelecionado || !mensagemAlteracao) {
            alert("Por favor, descreva as alterações que deseja.");
            return;
        }
        try {
            const orcamentoRef = doc(db, 'orcamentos', orcamentoSelecionado.id);
            await updateDoc(orcamentoRef, {
                status: 'devolvido',
                notas_funcionario: `[SOLICITAÇÃO DO CLIENTE]: ${mensagemAlteracao}`
            });
            alert('Solicitação de alteração enviada com sucesso!');
            handleCloseAlteracaoModal();
            fetchOrcamentos();
        } catch (error) {
            alert('Erro ao enviar a sua solicitação.');
        }
    };

    const statusMap = {
        'solicitado': { text: 'Solicitado', color: 'bg-blue-100 text-blue-800' },
        'em analise': { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
        'aguardando cliente': { text: 'Aguardando sua Aprovação', color: 'bg-orange-100 text-orange-800' },
        'aprovado': { text: 'Aprovado', color: 'bg-green-100 text-green-800' },
        'cancelado': { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
        'devolvido': { text: 'Devolvido para Análise', color: 'bg-purple-100 text-purple-800' },
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-texto-principal">Meus Orçamentos</h1>
                <Link to="/solicitar-orcamento">
                    <Button className="w-auto">Solicitar Novo Orçamento</Button>
                </Link>
            </div>
            <div className="space-y-4">
                {loading ? (<p>A carregar...</p>) :
                    orcamentos.length === 0 ? (<p>Ainda não tem orçamentos.</p>) : (
                        orcamentos.map(orcamento => (
                            <div key={orcamento.id} className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-texto-secundario">Orçamento #{orcamento.id.substring(0, 6)}</p>
                                        <p className="text-xl font-bold text-texto-principal">{orcamento.nome_empresa}</p>
                                        <p className="mt-2 text-texto-secundario">{orcamento.descricao}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primaria-padrao">{Number(orcamento.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${(statusMap as any)[orcamento.status]?.color}`}>
                                            {(statusMap as any)[orcamento.status]?.text}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-4 mt-4 border-t border-borda pt-4">
                                    {orcamento.status === 'aguardando cliente' && (
                                        <>
                                            <Button onClick={() => handleOpenAlteracaoModal(orcamento)} variant="secondary" className="w-auto">Solicitar Alteração</Button>
                                            <Button onClick={() => handleOpenModal(orcamento)} className="w-auto">Aprovar Orçamento</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
            </div>
            {orcamentoSelecionado && isModalOpen && <ModalAprovacao isOpen={isModalOpen} onClose={handleCloseModal} orcamento={orcamentoSelecionado} onSuccess={handleActionSuccess} />}
            {orcamentoSelecionado && isAlteracaoModalOpen && (
                <Modal isOpen={isAlteracaoModalOpen} onClose={handleCloseAlteracaoModal} title={`Solicitar Alteração no Orçamento`}>
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Descreva o que gostaria de alterar:</label>
                        <textarea value={mensagemAlteracao} onChange={e => setMensagemAlteracao(e.target.value)} rows={5} className="w-full px-4 py-3 bg-white border border-borda rounded-lg" />
                    </div>
                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                        <Button onClick={handleCloseAlteracaoModal} variant="secondary">Cancelar</Button>
                        <Button onClick={handleEnviarSolicitacaoAlteracao} variant="primary">Enviar Solicitação</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function ModalAprovacao({ isOpen, onClose, orcamento, onSuccess }: any) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ data_execucao_solicitada: '' });
    const sigCanvas = useRef<SignatureCanvas>(null);

    const handleAprovar = async () => {
        if (!user || sigCanvas.current?.isEmpty()) {
            alert('A sua assinatura digital é obrigatória.');
            return;
        }

        try {
            const agendamentoData = {
                empresa_id: orcamento.empresa_id,
                usuario_id: user.uid,
                orcamento_id: orcamento.id,
                data_hora_inicio: new Date(formData.data_execucao_solicitada),
                status: 'agendado',
            };
            const agendamentoRef = await addDoc(collection(db, 'agendamentos'), agendamentoData);

            const orcamentoRef = doc(db, 'orcamentos', orcamento.id);
            await updateDoc(orcamentoRef, {
                status: 'aprovado',
                agendamento_id: agendamentoRef.id,
                assinatura_digital: sigCanvas.current?.toDataURL('image/png')
            });

            alert('Orçamento aprovado e agendado com sucesso!');
            onSuccess();
        } catch (error) {
            alert('Erro ao aprovar o orçamento.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Aprovar Orçamento #${orcamento.id.substring(0, 6)}`}>
            <div className="space-y-4">
                <Input label="Data e Hora para Execução" name="data_execucao_solicitada" type="datetime-local" value={formData.data_execucao_solicitada} onChange={e => setFormData({ ...formData, data_execucao_solicitada: e.target.value })} required />
                <div>
                    <label className="text-sm font-semibold text-texto-secundario block mb-2">Assinatura Digital</label>
                    <div className="bg-white border border-borda rounded-lg">
                        <SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'w-full h-32' }} />
                    </div>
                    <Button variant="secondary" onClick={() => sigCanvas.current?.clear()} className="w-auto !text-xs !py-1 !px-2 mt-2">Limpar Assinatura</Button>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                <Button onClick={onClose} variant="secondary">Voltar</Button>
                <Button onClick={handleAprovar} variant="primary">Confirmar e Agendar</Button>
            </div>
        </Modal>
    );
}