import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- INTERFACES ---
interface Servico { id: number; nome: string; descricao: string; preco: string; duracao_minutos: number; }
interface Produto { id: number; nome: string; preco_venda: number; }
interface Funcionario { id: number; nome: string; }
interface OrdemServico {
    id: number;
    data_hora_inicio: string;
    status: string;
    usuario_nome: string;
    usuario_email: string;
    usuario_telefone: string;
    servicos: Servico[];
    produtos: Produto[];
    funcionario_id: number | null;
    veiculo_placa: string | null;
    veiculo_marca: string | null;
    veiculo_modelo: string | null;
    veiculo_ano: string | null;
    veiculo_cor: string | null;
}
interface FormaPagamento { id: number; nome: string; }
interface CondicaoPagamento { id: number; nome: string; }
interface Checklist { id: number; data_checkin: string | null; data_checkout: string | null; }

const statusOptions = ['agendado', 'em andamento', 'aguardando cliente', 'aguardando peça', 'concluido', 'cancelado'];

export default function OrdemDeServicoEmpresaPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [os, setOs] = useState<OrdemServico | null>(null);
    const [originalStatus, setOriginalStatus] = useState<string | null>(null);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
    const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
    const [itemParaAdicionar, setItemParaAdicionar] = useState({ id: '', tipo: 'servico' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
    const [condicoesPagamento, setCondicoesPagamento] = useState<CondicaoPagamento[]>([]);
    const [selectedFormaPagamento, setSelectedFormaPagamento] = useState('');
    const [selectedCondicaoPagamento, setSelectedCondicaoPagamento] = useState('');
    const [isEmitting, setIsEmitting] = useState(false);
    const [notaFiscalInfo, setNotaFiscalInfo] = useState<any>(null);
    const [checklist, setChecklist] = useState<Checklist | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!id) {
                setError('ID do agendamento não fornecido.');
                setLoading(false);
                return;
            }
            try {
                const [osResponse, funcionariosResponse, servicosResponse, produtosResponse, formasRes, condicoesRes, checklistRes] = await Promise.all([
                    api.get(`/agendamentos/${id}/detalhes`),
                    api.get<Funcionario[]>('/funcionarios'),
                    api.get<Servico[]>('/servicos'),
                    api.get<Produto[]>('/produtos'),
                    api.get('/formas-pagamento'),
                    api.get('/condicoes-pagamento'),
                    api.get(`/checklist/agendamento/${id}`)
                ]);

                const data = osResponse.data;
                if (!Array.isArray(data.servicos)) data.servicos = [];
                if (!Array.isArray(data.produtos)) data.produtos = [];
                setOs(data);
                setOriginalStatus(data.status);
                setFuncionarios(funcionariosResponse.data);
                setServicosDisponiveis(servicosResponse.data);
                setProdutosDisponiveis(produtosResponse.data);
                setFormasPagamento(formasRes.data);
                setCondicoesPagamento(condicoesRes.data);
                setChecklist(checklistRes.data);

            } catch (err) {
                setError('Não foi possível carregar os dados da Ordem de Serviço.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [id]);

    const handleAdicionarItem = async () => {
        if (!itemParaAdicionar.id || !os) return;
        try {
            if (itemParaAdicionar.tipo === 'servico') {
                await api.post(`/agendamentos/${os.id}/servicos`, { servico_id: itemParaAdicionar.id });
            } else {
                const produto = produtosDisponiveis.find(p => p.id === parseInt(itemParaAdicionar.id));
                if (produto) {
                    await api.post(`/agendamentos/${os.id}/produtos`, {
                        produto_id: produto.id,
                        quantidade: 1,
                        preco_unitario: produto.preco_venda
                    });
                }
            }
            const response = await api.get(`/agendamentos/${id}/detalhes`);
            setOs(response.data);
            setItemParaAdicionar({ id: '', tipo: 'servico' });
        } catch (error: any) {
            alert(error.response?.data?.error || "Erro ao adicionar item.");
        }
    };

    const handleSalvarOS = async () => {
        if (!os) return;
        if (os.status === 'concluido' && originalStatus !== 'concluido') {
            setIsPaymentModalOpen(true);
            return;
        }
        try {
            await api.patch(`/agendamentos/${os.id}/status`, { status: os.status });
            await api.patch(`/agendamentos/${os.id}/funcionario`, { funcionario_id: os.funcionario_id });
            alert('Ordem de Serviço salva com sucesso!');
            navigate('/kanban');
        } catch (err) {
            alert('Erro ao salvar a Ordem de Serviço.');
        }
    };

    const handleFinalizarPagamento = async () => {
        if (!selectedFormaPagamento || !selectedCondicaoPagamento) {
            alert('Por favor, selecione a forma e a condição de pagamento.');
            return;
        }
        try {
            const payload = {
                forma_pagamento_id: selectedFormaPagamento,
                condicao_pagamento_id: selectedCondicaoPagamento,
            };
            await api.patch(`/agendamentos/${os?.id}/finalizar`, payload);
            alert('Ordem de Serviço finalizada com sucesso!');
            setIsPaymentModalOpen(false);
            if (os) {
                setOs({ ...os, status: 'concluido' });
                setOriginalStatus('concluido');
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao finalizar a Ordem de Serviço.');
        }
    };

    const handleGeneratePDF = () => {
        if (!os) return;
        const doc = new jsPDF();
        const osId = String(os.id).padStart(6, '0');
        const dataInicio = new Date(os.data_hora_inicio).toLocaleString('pt-BR');
        doc.setFontSize(20);
        doc.text(`Ordem de Serviço #${osId}`, 14, 22);
        doc.setFontSize(12);
        doc.text(`Data do Serviço: ${dataInicio}`, 14, 30);
        doc.setFontSize(14);
        doc.text("Dados do Cliente", 14, 45);
        autoTable(doc, {
            startY: 50,
            head: [['Cliente', 'Contato']],
            body: [[os.usuario_nome, os.usuario_email]],
            theme: 'striped'
        });
        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(14);
        doc.text("Itens da Ordem de Serviço", 14, finalY + 15);
        autoTable(doc, {
            startY: finalY + 20,
            head: [['Descrição', 'Tipo', 'Valor (R$)']],
            body: [
                ...os.servicos.map(s => [s.nome, 'Serviço', parseFloat(s.preco).toFixed(2)]),
                ...os.produtos.map(p => [p.nome, 'Produto', Number(p.preco_venda).toFixed(2)])
            ],
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
            foot: [['Total', '', totalOS.toFixed(2)]],
            footStyles: { fontStyle: 'bold' }
        });
        doc.save(`OS_${osId}_${os.usuario_nome}.pdf`);
    };

    const handleEmitirNotaServico = async () => {
        if (!os) return;
        if (!window.confirm("Tem a certeza de que deseja emitir a Nota Fiscal para os SERVIÇOS desta OS?")) return;
        setIsEmitting(true);
        try {
            const response = await api.post('/notas-fiscais/servico', { agendamentoId: os.id });
            alert(`Nota Fiscal de Serviço enviada para processamento! Status: ${response.data.status}`);
            setNotaFiscalInfo(response.data);
        } catch (error: any) {
            alert(`Falha ao emitir a Nota Fiscal: ${error.response?.data?.details || 'Erro desconhecido'}`);
        } finally {
            setIsEmitting(false);
        }
    };

    const handleEmitirNotaProduto = async () => {
        if (!os) return;
        if (!window.confirm("Tem a certeza de que deseja emitir a Nota/Cupom Fiscal para os PRODUTOS desta OS?")) return;
        setIsEmitting(true);
        try {
            const response = await api.post('/notas-fiscais/produto', { agendamentoId: os.id });
            alert(`Nota Fiscal de Produto enviada para processamento! Status: ${response.data.status}`);
            setNotaFiscalInfo(response.data);
        } catch (error: any) {
            alert(`Falha ao emitir a Nota Fiscal: ${error.response?.data?.details || 'Erro desconhecido'}`);
        } finally {
            setIsEmitting(false);
        }
    };

    const totalOS = useMemo(() => {
        if (!os) return 0;
        const totalServicos = os.servicos?.reduce((acc, item) => acc + parseFloat(item.preco || '0'), 0) || 0;
        const totalProdutos = os.produtos?.reduce((acc, item) => acc + parseFloat(String(item.preco_venda) || '0'), 0) || 0;
        return totalServicos + totalProdutos;
    }, [os]);

    const isLocked = originalStatus === 'concluido' || originalStatus === 'cancelado';
    const isCheckoutDisabled = os?.status !== 'concluido';

    if (loading) return <p className="text-center">Carregando...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!os) return <p className="text-center">Ordem de Serviço não encontrada.</p>;

    return (
        <div className="p-4 md:p-6 bg-fundo-principal">
            {isLocked && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 p-4 rounded-lg mb-6 text-center">
                    Esta Ordem de Serviço está <strong>{os.status}</strong> e não pode mais ser editada.
                </div>
            )}
            <h1 className="text-3xl font-bold mb-4 text-texto-principal">Ordem de Serviço #{String(os.id).padStart(6, '0')}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                        <h2 className="text-xl font-semibold mb-4 text-texto-principal">Cliente e Agendamento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm text-texto-secundario">Cliente</label><p className="font-bold text-lg">{os.usuario_nome}</p></div>
                            <div><label className="text-sm text-texto-secundario">Contacto (Email)</label><p className="font-semibold">{os.usuario_email}</p></div>
                            <div><label className="text-sm text-texto-secundario">Data de Início</label><p className="font-semibold">{new Date(os.data_hora_inicio).toLocaleString('pt-BR')}</p></div>
                            <div><label className="text-sm text-texto-secundario">Contacto (Telefone)</label><p className="font-semibold">{os.usuario_telefone || 'Não registado'}</p></div>
                        </div>
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                        <h2 className="text-xl font-semibold mb-4 text-texto-principal">Dados do Veículo</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div><label className="text-sm text-texto-secundario">Placa</label><p className="font-semibold">{os.veiculo_placa || 'N/A'}</p></div>
                            <div><label className="text-sm text-texto-secundario">Marca</label><p className="font-semibold">{os.veiculo_marca || 'N/A'}</p></div>
                            <div><label className="text-sm text-texto-secundario">Modelo</label><p className="font-semibold">{os.veiculo_modelo || 'N/A'}</p></div>
                            <div><label className="text-sm text-texto-secundario">Ano</label><p className="font-semibold">{os.veiculo_ano || 'N/A'}</p></div>
                            <div><label className="text-sm text-texto-secundario">Cor</label><p className="font-semibold">{os.veiculo_cor || 'N/A'}</p></div>
                        </div>
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                        <h2 className="text-xl font-semibold mb-4 text-texto-principal">Produtos e Serviços</h2>
                        <div className="overflow-x-auto mb-4">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-borda"><th className="p-2">Descrição</th><th className="p-2">Tipo</th><th className="p-2 text-right">Valor</th></tr>
                                </thead>
                                <tbody>
                                    {os.servicos.map(item => (<tr key={`s-${item.id}`}><td className="p-2">{item.nome}</td><td className="p-2"><span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Serviço</span></td><td className="p-2 text-right font-mono">{parseFloat(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>))}
                                    {os.produtos.map(item => (<tr key={`p-${item.id}`}><td className="p-2">{item.nome}</td><td className="p-2"><span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">Produto</span></td><td className="p-2 text-right font-mono">{Number(item.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                        {!isLocked && (
                            <div className="flex flex-wrap gap-2 border-t border-borda pt-4">
                                <select className="flex-grow px-4 py-2 bg-white border rounded-lg" value={itemParaAdicionar.tipo} onChange={e => setItemParaAdicionar({ id: '', tipo: e.target.value })}>
                                    <option value="servico">Adicionar Serviço</option>
                                    <option value="produto">Adicionar Produto</option>
                                </select>
                                <select className="flex-grow px-4 py-2 bg-white border rounded-lg" value={itemParaAdicionar.id} onChange={e => setItemParaAdicionar(prev => ({ ...prev, id: e.target.value }))}>
                                    <option value="">Selecione...</option>
                                    {itemParaAdicionar.tipo === 'servico'
                                        ? servicosDisponiveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)
                                        : produtosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)
                                    }
                                </select>
                                <Button variant="primary" onClick={handleAdicionarItem} className="w-full sm:w-auto px-4 py-2">Adicionar</Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                        <h3 className="text-lg font-semibold mb-4 text-texto-principal">Status e Atribuição</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="status" className="text-sm font-semibold text-texto-secundario block mb-2">Status da O.S.</label>
                                <select id="status" value={os.status} onChange={e => setOs({ ...os, status: e.target.value })} className="w-full px-4 py-2 bg-white border border-borda rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed" disabled={isLocked}>
                                    {statusOptions.map(opt => <option key={opt} value={opt} className="capitalize">{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="executor" className="text-sm font-semibold text-texto-secundario block mb-2">Executor</label>
                                <select id="executor" value={os.funcionario_id || ''} onChange={e => setOs({ ...os, funcionario_id: parseInt(e.target.value) || null })} className="w-full px-4 py-2 bg-white border border-borda rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed" disabled={isLocked}>
                                    <option value="">Nenhum</option>
                                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                        <h3 className="text-lg font-semibold mb-4 text-texto-principal">Total da O.S.</h3>
                        <div className="text-3xl font-bold text-right text-green-500">{totalOS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>

                    {os.status === 'concluido' && (
                        <div className="bg-fundo-secundario p-6 rounded-lg shadow-md border border-borda">
                            <h3 className="text-lg font-semibold mb-4 text-texto-principal">Documento Fiscal</h3>
                            {notaFiscalInfo ? (
                                <div className="space-y-2">
                                    <p><span className="font-semibold">Status:</span> {notaFiscalInfo.status}</p>
                                    <p><span className="font-semibold">Número:</span> {notaFiscalInfo.number}</p>
                                    <a href={notaFiscalInfo.flowPdfUrl || notaFiscalInfo.pdf} target="_blank" rel="noopener noreferrer" className="text-primaria-padrao hover:underline">
                                        Baixar PDF da Nota
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Button onClick={handleEmitirNotaServico} variant="primary" disabled={isEmitting || os.servicos.length === 0}>
                                        {isEmitting ? 'A emitir...' : 'Emitir NFS-e (Serviços)'}
                                    </Button>
                                    <Button onClick={handleEmitirNotaProduto} variant="primary" disabled={isEmitting || os.produtos.length === 0}>
                                        {isEmitting ? 'A emitir...' : 'Emitir NFC-e (Produtos)'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        {!checklist && (
                            <Link to={`/checklist/${os.id}`} state={{ modo: 'checkin' }}>
                                <button className="w-full text-center font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
                                    Realizar Check-in do Veículo
                                </button>
                            </Link>
                        )}

                        {checklist && !checklist.data_checkout && (
                            <>
                                <Link to={`/checklist/${os.id}`} state={{ modo: 'view' }} className="w-full block text-center font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-sm bg-fundo-secundario hover:bg-gray-700 text-texto-principal border border-borda">
                                    Ver Relatório de Vistoria
                                </Link>
                                <Link
                                    to={isCheckoutDisabled ? '#' : `/checklist/${os.id}`}
                                    state={{ modo: 'checkout' }}
                                    title={isCheckoutDisabled ? 'Finalize a OS para poder fazer o check-out' : 'Realizar Check-out do Veículo'}
                                    className={`w-full block text-center font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-sm ${isCheckoutDisabled
                                            ? 'bg-gray-600 text-gray-400 opacity-50 cursor-not-allowed'
                                            : 'bg-primaria-padrao hover:bg-primaria-escuro text-white'
                                        }`}
                                    onClick={(e) => { if (isCheckoutDisabled) e.preventDefault(); }}
                                >
                                    Realizar Check-out do Veículo
                                </Link>
                            </>
                        )}

                        {checklist && checklist.data_checkout && (
                            <Link to={`/checklist/${os.id}`} state={{ modo: 'view' }} className="w-full block text-center font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-sm bg-fundo-secundario hover:bg-gray-700 text-texto-principal border border-borda">
                                Ver Relatório Final de Vistoria
                            </Link>
                        )}

                        {!isLocked && (<Button onClick={handleSalvarOS} variant="primary">Salvar O.S.</Button>)}
                        <Button onClick={handleGeneratePDF} variant="secondary">Imprimir PDF da OS</Button>
                        <Button onClick={() => navigate('/kanban')} variant="secondary">Voltar para o Quadro</Button>
                    </div>
                </div>
            </div>
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Finalizar e Registrar Pagamento">
                <div className="space-y-4 text-texto-principal">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Forma de Pagamento</label>
                        <select value={selectedFormaPagamento} onChange={e => setSelectedFormaPagamento(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option value="">Selecione...</option>{formasPagamento.map(fp => <option key={fp.id} value={fp.id}>{fp.nome}</option>)}</select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Condição de Pagamento</label>
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