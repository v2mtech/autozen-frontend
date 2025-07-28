import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

// --- INTERFACES ---
interface Servico {
    nome: string;
    preco: string;
}

interface AgendamentoCliente {
    id: number;
    data_hora_inicio: string;
    status: 'agendado' | 'em andamento' | 'concluido' | 'cancelado';
    empresa_nome_fantasia: string;
    servicos: Servico[] | null; // Permitir que seja nulo vindo da API
    avaliacao_id: number | null;
}

// --- FUNÇÕES AUXILIARES ---
function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTotalCurrency(servicos: Servico[] | null) {
    if (!Array.isArray(servicos)) {
        return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    const total = servicos.reduce((acc, servico) => acc + parseFloat(servico.preco), 0);
    return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MeusAgendamentosPage() {
    const [agendamentos, setAgendamentos] = useState<AgendamentoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- STATES PARA FILTROS ---
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroDataInicio, setFiltroDataInicio] = useState('');
    const [filtroDataFim, setFiltroDataFim] = useState('');

    // --- STATES PARA O MODAL DE AVALIAÇÃO ---
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [agendamentoParaAvaliar, setAgendamentoParaAvaliar] = useState<AgendamentoCliente | null>(null);
    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState('');

    const fetchMeusAgendamentos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filtroStatus) params.append('status', filtroStatus);
            if (filtroDataInicio) params.append('data_inicio', filtroDataInicio);
            if (filtroDataFim) params.append('data_fim', filtroDataFim);

            const response = await api.get<AgendamentoCliente[]>('/agendamentos/meus', { params });
            setAgendamentos(response.data);
        } catch (err) {
            setError('Não foi possível carregar seus agendamentos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filtroStatus, filtroDataInicio, filtroDataFim]);

    useEffect(() => {
        fetchMeusAgendamentos();
    }, [fetchMeusAgendamentos]);

    const handleCancelarAgendamento = async (agendamentoId: number) => {
        if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
            try {
                await api.patch(`/agendamentos/${agendamentoId}/cancelar`);
                fetchMeusAgendamentos();
            } catch (err: any) {
                alert(err.response?.data?.error || 'Não foi possível cancelar o agendamento.');
            }
        }
    };

    const handleOpenReviewModal = (ag: AgendamentoCliente) => {
        setAgendamentoParaAvaliar(ag);
        setNota(0);
        setComentario('');
        setReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!agendamentoParaAvaliar || nota === 0) {
            alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
            return;
        }
        try {
            await api.post('/avaliacoes', {
                agendamento_id: agendamentoParaAvaliar.id,
                nota,
                comentario
            });
            alert('Avaliação enviada com sucesso! Agradecemos seu feedback.');
            setReviewModalOpen(false);
            fetchMeusAgendamentos(); 
        } catch (err: any) {
            alert(err.response?.data?.error || 'Não foi possível enviar a avaliação.');
        }
    };

    if (loading) return <p className="text-gray-400 text-center">Carregando seus agendamentos...</p>;
    if (error) return <p className="text-red-500 text-center">{error}</p>;

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white">Meus Agendamentos</h1>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-fundo-secundario rounded-lg shadow-md">
                <div className="flex-1 min-w-[200px]"><Input label="De:" type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} /></div>
                <div className="flex-1 min-w-[200px]"><Input label="Até:" type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} /></div>
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="status-filter" className="text-sm font-semibold text-gray-400 block mb-2">Filtrar por Status</label>
                    <select id="status-filter" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primaria-padrao text-white">
                        <option value="">Todos os Status</option>
                        <option value="agendado">Agendado</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            {agendamentos.length === 0 ? (
                <div className="bg-fundo-secundario rounded-lg p-8 text-center"><p className="text-gray-400">Nenhum agendamento encontrado.</p></div>
            ) : (
                <div className="bg-fundo-secundario rounded-lg overflow-hidden shadow-lg">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4 font-semibold">Estabelecimento</th>
                                <th className="p-4 font-semibold">Serviços</th>
                                <th className="p-4 font-semibold">Data e Hora</th>
                                <th className="p-4 font-semibold">Valor Total</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agendamentos.map(agendamento => {
                                const isCancellable = agendamento.status === 'agendado';
                                const isConcluido = agendamento.status === 'concluido';
                                const podeAvaliar = isConcluido && !agendamento.avaliacao_id;
                                const nomesServicos = Array.isArray(agendamento.servicos)
                                    ? agendamento.servicos.map(s => s.nome).join(', ')
                                    : 'N/A';

                                return (
                                    <tr key={agendamento.id} className="border-b border-gray-700 last:border-b-0">
                                        <td className="p-4">{agendamento.empresa_nome_fantasia}</td>
                                        <td className="p-4">{nomesServicos}</td>
                                        <td className="p-4">{formatDateTime(agendamento.data_hora_inicio)}</td>
                                        <td className="p-4">{formatTotalCurrency(agendamento.servicos)}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${agendamento.status === 'agendado' ? 'bg-yellow-500 text-yellow-900' : isConcluido ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'}`}>{agendamento.status}</span></td>
                                        <td className="p-4 flex flex-col md:flex-row gap-2 items-start">
                                            {isCancellable && (<button onClick={() => handleCancelarAgendamento(agendamento.id)} className="text-red-400 hover:text-red-300 font-semibold text-sm">Cancelar</button>)}
                                            {podeAvaliar && (<Button onClick={() => handleOpenReviewModal(agendamento)} variant="secondary" className="text-xs py-1 px-3 w-auto">Avaliar</Button>)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} title={`Avaliar Atendimento`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Sua Nota para {agendamentoParaAvaliar?.empresa_nome_fantasia}</label>
                        <div className="flex text-3xl cursor-pointer">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setNota(star)} onMouseOver={() => setNota(star)} className={`pr-1 ${nota >= star ? 'text-yellow-400' : 'text-gray-600'}`}>★</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="comentario" className="block text-sm font-semibold text-gray-400 mb-2">Seu Comentário (Opcional)</label>
                        <textarea id="comentario" value={comentario} onChange={e => setComentario(e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Descreva sua experiência..."></textarea>
                    </div>
                </div>
                <div className="flex justify-end pt-6">
                    <Button onClick={handleSubmitReview} variant="primary">Enviar Avaliação</Button>
                </div>
            </Modal>
        </div>
    );
}