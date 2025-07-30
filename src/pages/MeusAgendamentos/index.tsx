import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// --- INTERFACES ---
interface Servico {
    nome: string;
    preco: string;
}

interface AgendamentoCliente {
    id: string; // ID do Firestore
    data_hora_inicio: { toDate: () => Date }; // Objeto de data do Firestore
    status: 'agendado' | 'em andamento' | 'concluido' | 'cancelado';
    empresa_nome_fantasia: string;
    servicos: Servico[] | null;
    avaliacao_id: string | null;
}

// --- FUNÇÕES AUXILIARES ---
function formatDateTime(date: Date) {
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTotalCurrency(servicos: Servico[] | null) {
    if (!Array.isArray(servicos)) {
        return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    const total = servicos.reduce((acc, servico) => acc + parseFloat(servico.preco), 0);
    return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MeusAgendamentosPage() {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<AgendamentoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [agendamentoParaAvaliar, setAgendamentoParaAvaliar] = useState<AgendamentoCliente | null>(null);
    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState('');

    const fetchMeusAgendamentos = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const agendamentosRef = collection(db, 'agendamentos');
            let q = query(agendamentosRef, where("usuario_id", "==", user.uid));

            if (filtroStatus) {
                q = query(q, where("status", "==", filtroStatus));
            }

            const querySnapshot = await getDocs(q);
            const agendamentosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgendamentoCliente));

            if (Array.isArray(agendamentosList)) {
                setAgendamentos(agendamentosList);
            } else {
                console.warn("A resposta da API para '/agendamentos/meus' não era um array. A definir como vazio.", agendamentosList);
                setAgendamentos([]);
            }
        } catch (err) {
            setError('Não foi possível carregar seus agendamentos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user, filtroStatus]);

    useEffect(() => {
        fetchMeusAgendamentos();
    }, [fetchMeusAgendamentos]);

    const handleCancelarAgendamento = async (agendamentoId: string) => {
        if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
            try {
                const agendamentoRef = doc(db, 'agendamentos', agendamentoId);
                await updateDoc(agendamentoRef, { status: 'cancelado' });
                fetchMeusAgendamentos();
            } catch (err) {
                alert('Não foi possível cancelar o agendamento.');
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
        if (!agendamentoParaAvaliar || !user || nota === 0) {
            alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
            return;
        }
        try {
            const avaliacaoData = {
                agendamento_id: agendamentoParaAvaliar.id,
                usuario_id: user.uid,
                usuario_nome: user.nome,
                empresa_id: (agendamentoParaAvaliar as any).empresa_id,
                nota,
                comentario,
                criado_em: new Date(),
            };
            const avaliacaoRef = await addDoc(collection(db, 'avaliacoes'), avaliacaoData);

            const agendamentoRef = doc(db, 'agendamentos', agendamentoParaAvaliar.id);
            await updateDoc(agendamentoRef, { avaliacao_id: avaliacaoRef.id });

            alert('Avaliação enviada com sucesso! Agradecemos seu feedback.');
            setReviewModalOpen(false);
            fetchMeusAgendamentos();
        } catch (err) {
            alert('Não foi possível enviar a avaliação.');
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar os seus agendamentos...</p>;
    if (error) return <p className="text-center text-erro">{error}</p>;

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-texto-principal">Meus Agendamentos</h1>
            </div>

            <div className="bg-fundo-secundario p-4 rounded-lg shadow-sm mb-8 border border-borda">
                <div className="w-full md:w-1/3">
                    <label htmlFor="status-filter" className="text-sm font-semibold text-texto-secundario block mb-2">Filtrar por Status</label>
                    <select id="status-filter" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full px-4 py-3 bg-white border border-borda rounded-lg focus:ring-2 focus:ring-primaria-escuro text-texto-principal">
                        <option value="">Todos os Status</option>
                        <option value="agendado">Agendado</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            <div className="bg-fundo-secundario rounded-lg overflow-hidden shadow-sm border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Estabelecimento</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Serviços</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data e Hora</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Valor Total</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {agendamentos.length === 0 ? (
                            <tr><td colSpan={6} className="text-center p-8 text-texto-secundario">Nenhum agendamento encontrado para os filtros selecionados.</td></tr>
                        ) : (
                            agendamentos.map(agendamento => {
                                const isCancellable = agendamento.status === 'agendado';
                                const isConcluido = agendamento.status === 'concluido';
                                const podeAvaliar = isConcluido && !agendamento.avaliacao_id;
                                const nomesServicos = Array.isArray(agendamento.servicos)
                                    ? agendamento.servicos.map(s => s.nome).join(', ')
                                    : 'N/A';

                                return (
                                    <tr key={agendamento.id} className="hover:bg-fundo-principal">
                                        <td className="p-4 text-texto-principal font-medium">{agendamento.empresa_nome_fantasia}</td>
                                        <td className="p-4 text-texto-secundario">{nomesServicos}</td>
                                        <td className="p-4 text-texto-secundario">{formatDateTime(agendamento.data_hora_inicio.toDate())}</td>
                                        <td className="p-4 text-texto-principal font-mono">{formatTotalCurrency(agendamento.servicos)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${agendamento.status === 'agendado' ? 'bg-yellow-100 text-yellow-800' :
                                                    isConcluido ? 'bg-green-100 text-green-800' :
                                                        agendamento.status === 'em andamento' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>{agendamento.status}</span>
                                        </td>
                                        <td className="p-4 flex flex-col md:flex-row gap-2 items-start">
                                            {isCancellable && (<button onClick={() => handleCancelarAgendamento(agendamento.id)} className="text-erro hover:opacity-75 font-semibold text-sm">Cancelar</button>)}
                                            {podeAvaliar && (<Button onClick={() => handleOpenReviewModal(agendamento)} variant="secondary" className="!text-xs !py-1 !px-3 !w-auto">Avaliar</Button>)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} title={`Avaliar Atendimento`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-texto-secundario mb-2">Sua Nota para {agendamentoParaAvaliar?.empresa_nome_fantasia}</label>
                        <div className="flex text-3xl cursor-pointer">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setNota(star)} onMouseOver={() => setNota(star)} className={`pr-1 ${nota >= star ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="comentario" className="block text-sm font-semibold text-texto-secundario mb-2">Seu Comentário (Opcional)</label>
                        <textarea id="comentario" value={comentario} onChange={e => setComentario(e.target.value)} rows={4} className="w-full px-4 py-3 bg-white border border-borda rounded-lg text-texto-principal" placeholder="Descreva sua experiência..."></textarea>
                    </div>
                </div>
                <div className="flex justify-end pt-6 mt-4 border-t border-borda">
                    <Button onClick={handleSubmitReview} variant="primary">Enviar Avaliação</Button>
                </div>
            </Modal>
        </div>
    );
}