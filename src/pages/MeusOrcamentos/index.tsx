import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- INTERFACES ---
interface Orcamento {
    id: number;
    descricao: string;
    data_orcamento: string;
    data_validade: string | null;
    valor_total: number;
    status: 'solicitado' | 'em analise' | 'aguardando cliente' | 'aprovado' | 'cancelado' | 'devolvido';
    nome_empresa: string;
    empresa_id: number;
    servicos_selecionados?: any[];
    produtos_selecionados?: any[];
}

interface Funcionario {
    id: number;
    nome: string;
}

const statusMap = {
    'solicitado': { text: 'Solicitado', color: 'bg-blue-100 text-blue-800' },
    'em analise': { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
    'aguardando cliente': { text: 'Aguardando a sua Aprovação', color: 'bg-orange-100 text-orange-800' },
    'aprovado': { text: 'Aprovado', color: 'bg-green-100 text-green-800' },
    'cancelado': { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
    'devolvido': { text: 'Devolvido para Análise', color: 'bg-purple-100 text-purple-800' },
};

export default function MeusOrcamentosPage() {
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
    const [triggerPdfGeneration, setTriggerPdfGeneration] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isAlteracaoModalOpen, setIsAlteracaoModalOpen] = useState(false);
    const [mensagemAlteracao, setMensagemAlteracao] = useState('');

    const fetchOrcamentos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orcamentos/cliente');
            setOrcamentos(response.data);
        } catch (error) {
            console.error("Erro ao carregar orçamentos:", error);
            alert('Não foi possível carregar os seus orçamentos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrcamentos();
    }, []);

    useEffect(() => {
        if (triggerPdfGeneration && pdfRef.current) {
            html2canvas(pdfRef.current, { scale: 2 })
                .then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`orcamento_${orcamentoSelecionado?.id}.pdf`);
                });
            setTriggerPdfGeneration(false);
            setOrcamentoSelecionado(null);
        }
    }, [triggerPdfGeneration, orcamentoSelecionado]);

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

    const handlePreparePDF = (orcamento: Orcamento) => {
        setOrcamentoSelecionado(orcamento);
        setTriggerPdfGeneration(true);
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
            await api.patch(`/orcamentos/cliente/${orcamentoSelecionado.id}/solicitar-alteracao`, {
                mensagem_alteracao: mensagemAlteracao
            });
            alert('Solicitação de alteração enviada com sucesso!');
            handleCloseAlteracaoModal();
            fetchOrcamentos();
        } catch (error) {
            alert('Erro ao enviar a sua solicitação.');
        }
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
                {loading ? (
                    <p>A carregar...</p>
                ) : orcamentos.length === 0 ? (
                    <p>Ainda não tem orçamentos.</p>
                ) : (
                    orcamentos.map(orcamento => (
                        <div key={orcamento.id} className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-texto-secundario">Orçamento #{orcamento.id}</p>
                                    <p className="text-xl font-bold text-texto-principal">{orcamento.nome_empresa}</p>
                                    <p className="mt-2">{orcamento.descricao}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primaria-padrao">{Number(orcamento.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${(statusMap as any)[orcamento.status]?.color}`}>
                                        {(statusMap as any)[orcamento.status]?.text}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-4 border-t border-borda pt-4">
                                {orcamento.status === 'aprovado' && (
                                    <Button onClick={() => handlePreparePDF(orcamento)} className="w-auto">Baixar PDF</Button>
                                )}
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

            {orcamentoSelecionado && isModalOpen && (
                <ModalAprovacao
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    orcamento={orcamentoSelecionado}
                    onSuccess={handleActionSuccess}
                />
            )}

            {orcamentoSelecionado && isAlteracaoModalOpen && (
                <Modal isOpen={isAlteracaoModalOpen} onClose={handleCloseAlteracaoModal} title={`Solicitar Alteração no Orçamento #${orcamentoSelecionado.id}`}>
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Descreva o que gostaria de alterar, adicionar ou remover:</label>
                        <textarea
                            value={mensagemAlteracao}
                            onChange={e => setMensagemAlteracao(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-white border border-borda rounded-lg"
                            placeholder="Ex: Gostaria de remover o polimento e adicionar a aplicação de cera."
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                        <Button onClick={handleCloseAlteracaoModal} variant="secondary">Cancelar</Button>
                        <Button onClick={handleEnviarSolicitacaoAlteracao} variant="primary">Enviar Solicitação</Button>
                    </div>
                </Modal>
            )}

            {triggerPdfGeneration && orcamentoSelecionado && (
                <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                    <div ref={pdfRef} id="pdf-content" className="p-10 bg-white text-black w-[210mm]">
                        <h1 className="text-2xl font-bold">Orçamento #{orcamentoSelecionado.id}</h1>
                        <p><strong>Empresa:</strong> {orcamentoSelecionado.nome_empresa}</p>
                        <p><strong>Data:</strong> {new Date(orcamentoSelecionado.data_orcamento).toLocaleDateString('pt-BR')}</p>
                        <hr className="my-4" />
                        <p><strong>Descrição:</strong> {orcamentoSelecionado.descricao}</p>
                        <hr className="my-4" />
                        <h2 className="text-xl font-bold">Total: {Number(orcamentoSelecionado.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ModalAprovacaoProps { isOpen: boolean; onClose: () => void; orcamento: Orcamento; onSuccess: () => void; }

function ModalAprovacao({ isOpen, onClose, orcamento, onSuccess }: ModalAprovacaoProps) {
    const [formData, setFormData] = useState({ nome_aprovador: '', documento_aprovador: '', mensagem_aprovacao: '', data_execucao_solicitada: '', funcionario_id_solicitado: '' });
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const sigCanvas = useRef<SignatureCanvas>(null);

    useEffect(() => {
        if (isOpen && orcamento.empresa_id) {
            api.get(`/funcionarios/empresa/${orcamento.empresa_id}`).then(res => {
                setFuncionarios(res.data);
            }).catch(err => console.error("Falha ao carregar funcionários", err));
        }
    }, [isOpen, orcamento]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAprovar = async () => {
        if (sigCanvas.current?.isEmpty()) {
            alert('Por favor, forneça a sua assinatura digital.');
            return;
        }
        const assinatura = sigCanvas.current?.toDataURL('image/png');
        const payload = { ...formData, assinatura_digital: assinatura };

        try {
            await api.post(`/orcamentos/${orcamento.id}/aprovar`, payload);
            alert('Orçamento aprovado e agendado com sucesso!');
            onSuccess();
        } catch (error) {
            alert('Erro ao aprovar o orçamento.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Aprovar Orçamento #${orcamento.id}`} maxWidthClass="max-w-3xl">
            <div className="space-y-4">
                <Input label="Nome Completo (para aprovação)" name="nome_aprovador" value={formData.nome_aprovador} onChange={handleChange} required />
                <Input label="CPF ou CNPJ" name="documento_aprovador" value={formData.documento_aprovador} onChange={handleChange} required />
                <textarea name="mensagem_aprovacao" value={formData.mensagem_aprovacao} onChange={handleChange} placeholder="Adicione uma mensagem (opcional)..." className="w-full px-4 py-3 bg-white border border-borda rounded-lg" rows={3}></textarea>
                <Input label="Data e Hora para Execução" name="data_execucao_solicitada" type="datetime-local" value={formData.data_execucao_solicitada} onChange={handleChange} required />

                <div>
                    <label className="text-sm font-semibold text-texto-secundario block mb-2">Preferência de Funcionário (Opcional)</label>
                    <select name="funcionario_id_solicitado" value={formData.funcionario_id_solicitado} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                        <option value="">Qualquer um</option>
                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-semibold text-texto-secundario block mb-2">Assinatura Digital</label>
                    <div className="bg-white border border-borda rounded-lg">
                        <SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'w-full h-32' }} />
                    </div>
                    <Button variant="secondary" onClick={() => sigCanvas.current?.clear()} className="w-auto text-xs py-1 px-2 mt-2">
                        Limpar Assinatura
                    </Button>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                <Button onClick={onClose} variant="secondary">Voltar</Button>
                <Button onClick={handleAprovar} variant="primary">Confirmar e Agendar</Button>
            </div>
        </Modal>
    );
}