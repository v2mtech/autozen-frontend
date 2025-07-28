import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventClickArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

// Interfaces
interface Funcionario { id: number; nome: string; }
interface FormaPagamento { id: number; nome: string; }
interface CondicaoPagamento { id: number; nome: string; }
interface CalendarEvent {
    id: string;
    extendedProps: {
        status: 'agendado' | 'em andamento' | 'concluido' | 'cancelado';
        [key: string]: any;
    };
    [key: string]: any;
}
interface AgendamentoEditavel {
    id: string;
    status: 'agendado' | 'em andamento' | 'concluido' | 'cancelado';
    [key: string]: any;
}

export default function AgendaPage() {
    const [agendamentos, setAgendamentos] = useState<CalendarEvent[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
    const [condicoesPagamento, setCondicoesPagamento] = useState<CondicaoPagamento[]>([]);
    const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<string>('');
    const [selectedCondicaoPagamento, setSelectedCondicaoPagamento] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<AgendamentoEditavel | null>(null);
    const [isEditable, setIsEditable] = useState(false);

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const [agendaRes, funcRes, formasRes, condicoesRes] = await Promise.all([
                api.get<CalendarEvent[]>('/agendamentos'),
                api.get<Funcionario[]>('/funcionarios'),
                api.get<FormaPagamento[]>('/formas-pagamento'),
                api.get<CondicaoPagamento[]>('/condicoes-pagamento')
            ]);
            setAgendamentos(agendaRes.data);
            setFuncionarios(funcRes.data);
            setFormasPagamento(formasRes.data);
            setCondicoesPagamento(condicoesRes.data);
        } catch (err) {
            console.error("Erro ao carregar dados da agenda:", err);
        } finally {
            setLoading(false);
        }
    }, []);

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
        setSelectedFormaPagamento('');
        setSelectedCondicaoPagamento('');
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!agendamentoParaEditar) return;
        if (agendamentoParaEditar.status === 'concluido' && (!selectedFormaPagamento || !selectedCondicaoPagamento)) {
            alert('Para concluir, por favor, selecione a Forma e a Condição de Pagamento.');
            return;
        }

        try {
            const statusPayload: any = { status: agendamentoParaEditar.status };
            if (agendamentoParaEditar.status === 'concluido') {
                statusPayload.forma_pagamento_id = selectedFormaPagamento;
                statusPayload.condicao_pagamento_id = selectedCondicaoPagamento;
            }
            await api.patch(`/agendamentos/${agendamentoParaEditar.id}/status`, statusPayload);
            
            if (isEditable) {
                await api.patch(`/agendamentos/${agendamentoParaEditar.id}/funcionario`, { funcionario_id: agendamentoParaEditar.funcionario_id });
            }

            setIsModalOpen(false);
            fetchPageData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao guardar as alterações.');
        }
    };

    if (loading) return <p className="text-center text-gray-400">A carregar agenda...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Agenda Visual</h1>
            <div className="bg-fundo-secundario rounded-lg p-4 shadow-lg text-texto-principal">
                <FullCalendar
                    plugins={[dayGridPlugin]} initialView="dayGridMonth" locale={ptBrLocale}
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }}
                    buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
                    events={agendamentos} eventClick={handleEventClick} height="auto"
                />
            </div>
            {agendamentoParaEditar && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Agendamento #${agendamentoParaEditar.id}`}>
                    <div className="space-y-4 text-texto-principal">
                        <p><strong>Cliente:</strong> {agendamentoParaEditar.cliente}</p>
                        <p><strong>Serviços:</strong> {agendamentoParaEditar.servicos}</p>
                        <hr className="border-borda" />
                        <div>
                            <label className="block text-sm font-semibold mb-2">Associar Funcionário</label>
                            <select value={agendamentoParaEditar.funcionario_id} onChange={e => setAgendamentoParaEditar({ ...agendamentoParaEditar, funcionario_id: e.target.value })} disabled={!isEditable} className="w-full p-2 border rounded-lg bg-white disabled:bg-gray-200 disabled:cursor-not-allowed">
                                <option value="">Nenhum</option>
                                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Alterar Status</label>
                            <select value={agendamentoParaEditar.status} onChange={e => setAgendamentoParaEditar({ ...agendamentoParaEditar, status: e.target.value as any })} disabled={!isEditable} className="w-full p-2 border rounded-lg bg-white disabled:bg-gray-200 disabled:cursor-not-allowed">
                                <option value="agendado">Agendado</option>
                                <option value="em andamento">Em Andamento</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado" disabled>Cancelado</option>
                            </select>
                        </div>
                        
                        {/* CORREÇÃO APLICADA AQUI */}
                        {(agendamentoParaEditar.status === 'concluido') && isEditable && (
                            <div className="space-y-4 border-t border-borda pt-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Forma de Pagamento</label>
                                    <select value={selectedFormaPagamento} onChange={e => setSelectedFormaPagamento(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {formasPagamento.map(fp => <option key={fp.id} value={fp.id}>{fp.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Condição de Pagamento</label>
                                    <select value={selectedCondicaoPagamento} onChange={e => setSelectedCondicaoPagamento(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {condicoesPagamento.map(cp => <option key={cp.id} value={cp.id}>{cp.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
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