import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventClickArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Interfaces
interface Funcionario { id: string; nome: string; }
interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    color: string;
    extendedProps: {
        status: string;
        cliente: string;
        servicos: string;
        funcionario_id: string | null;
        cliente_telefone: string | null;
    };
}
interface AgendamentoEditavel {
    id: string;
    status: string;
    cliente: string;
    servicos: string;
    funcionario_id: string | null;
    start: string;
}

export default function AgendaPage() {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<CalendarEvent[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<AgendamentoEditavel | null>(null);
    const [isEditable, setIsEditable] = useState(false);

    const fetchPageData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Busca Agendamentos
            const agendaRef = collection(db, 'agendamentos');
            const qAgenda = query(agendaRef, where("empresa_id", "==", user.uid));
            const agendaSnap = await getDocs(qAgenda);
            const agendaList = agendaSnap.docs.map(doc => {
                const data = doc.data();
                const statusColors: { [key: string]: string } = {
                    agendado: '#f59e0b', 'em andamento': '#3b82f6', 'concluido': '#22c55e',
                    'cancelado': '#ef4444', 'aguardando cliente': '#8b5cf6', 'aguardando peça': '#eab308'
                };
                return {
                    id: doc.id,
                    title: `${data.usuario_nome} - ${data.funcionario_nome || 'Sem funcionário'}`,
                    start: data.data_hora_inicio.toDate(),
                    end: data.data_hora_fim.toDate(),
                    color: statusColors[data.status] || '#6b7280',
                    extendedProps: {
                        status: data.status,
                        cliente: data.usuario_nome,
                        servicos: data.servicos_nomes || 'N/A',
                        funcionario_id: data.funcionario_id || null,
                        cliente_telefone: data.usuario_telefone || null,
                    }
                } as CalendarEvent;
            });
            setAgendamentos(agendaList);

            // Busca Funcionários
            const funcRef = collection(db, 'funcionarios');
            const qFunc = query(funcRef, where("empresa_id", "==", user.uid));
            const funcSnap = await getDocs(qFunc);
            const funcList = funcSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funcionario));
            setFuncionarios(funcList);

        } catch (err) {
            console.error("Erro ao carregar dados da agenda:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const { id, start, extendedProps } = clickInfo.event;
        const statusInicial = extendedProps.status;

        setIsEditable(statusInicial !== 'concluido' && statusInicial !== 'cancelado');

        setAgendamentoParaEditar({
            id,
            cliente: extendedProps.cliente,
            servicos: extendedProps.servicos,
            status: statusInicial,
            funcionario_id: extendedProps.funcionario_id || '',
            start: new Date(start || Date.now()).toLocaleString('pt-BR'),
        });
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!agendamentoParaEditar || !isEditable) return;

        try {
            const agendamentoRef = doc(db, 'agendamentos', agendamentoParaEditar.id);
            await updateDoc(agendamentoRef, {
                status: agendamentoParaEditar.status,
                funcionario_id: agendamentoParaEditar.funcionario_id || null
            });

            setIsModalOpen(false);
            fetchPageData(); // Recarrega os eventos
        } catch (err: any) {
            alert('Erro ao guardar as alterações.');
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar agenda...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Agenda Visual</h1>
            <div className="bg-fundo-secundario rounded-lg p-4 shadow-sm text-texto-principal border border-borda">
                <FullCalendar
                    plugins={[dayGridPlugin]} initialView="dayGridMonth" locale={ptBrLocale}
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }}
                    buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
                    events={agendamentos} eventClick={handleEventClick} height="auto"
                />
            </div>
            {agendamentoParaEditar && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Agendamento #${agendamentoParaEditar.id.substring(0, 6)}`}>
                    <div className="space-y-4 text-texto-principal">
                        <p><strong>Cliente:</strong> {agendamentoParaEditar.cliente}</p>
                        <p><strong>Serviços:</strong> {agendamentoParaEditar.servicos}</p>
                        <hr className="border-borda" />
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-texto-secundario">Associar Funcionário</label>
                            <select value={agendamentoParaEditar.funcionario_id || ''} onChange={e => setAgendamentoParaEditar({ ...agendamentoParaEditar, funcionario_id: e.target.value })} disabled={!isEditable} className="w-full p-2 border rounded-lg bg-white text-texto-principal disabled:bg-gray-200 disabled:cursor-not-allowed">
                                <option value="">Nenhum</option>
                                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-texto-secundario">Alterar Status</label>
                            <select value={agendamentoParaEditar.status} onChange={e => setAgendamentoParaEditar({ ...agendamentoParaEditar, status: e.target.value as any })} disabled={!isEditable} className="w-full p-2 border rounded-lg bg-white text-texto-principal disabled:bg-gray-200 disabled:cursor-not-allowed">
                                <option value="agendado">Agendado</option>
                                <option value="em andamento">Em Andamento</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado" disabled>Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-4 pt-6 mt-4 border-t border-borda">
                        <Link to={`/ordem-de-servico/${agendamentoParaEditar.id}`}>
                            <Button variant="secondary">Ver Ordem de Serviço</Button>
                        </Link>
                        {isEditable && <Button onClick={handleSaveChanges}>Guardar Alterações</Button>}
                    </div>
                </Modal>
            )}
        </div>
    );
}