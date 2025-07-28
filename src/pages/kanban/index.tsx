import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsappIcon = FaWhatsapp as React.ElementType;

interface Agendamento {
    id: string;
    title: string;
    extendedProps: {
        cliente: string;
        servicos: string;
        status: string;
        cliente_telefone: string | null;
    };
}

interface Column {
    id: string;
    title: string;
    items: Agendamento[];
}

interface Columns {
    [key: string]: Column;
}

const statusToColumnId: { [key: string]: string } = {
    'agendado': 'agendado',
    'em andamento': 'emExecucao',
    'aguardando cliente': 'aguardandoCliente',
    'aguardando peça': 'aguardandoPecas',
    'concluido': 'historico',
    'cancelado': 'historico',
};

export default function KanbanPage() {
    const [columns, setColumns] = useState<Columns>({
        'agendado': { id: 'agendado', title: 'Agendado', items: [] },
        'emExecucao': { id: 'emExecucao', title: 'Em Execução', items: [] },
        'aguardandoCliente': { id: 'aguardandoCliente', title: 'Aguardando Cliente', items: [] },
        'aguardandoPecas': { id: 'aguardandoPecas', title: 'Aguardando Peças', items: [] },
        'historico': { id: 'historico', title: 'Histórico', items: [] },
    });
    const [loading, setLoading] = useState(true);

    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Agendamento[]>('/agendamentos');

            // ✅ CORREÇÃO DE ROBUSTEZ: Garante que a resposta da API é um array antes de continuar
            const agendamentos = Array.isArray(response.data) ? response.data : [];

            const newColumns: Columns = {
                'agendado': { id: 'agendado', title: 'Agendado', items: [] },
                'emExecucao': { id: 'emExecucao', title: 'Em Execução', items: [] },
                'aguardandoCliente': { id: 'aguardandoCliente', title: 'Aguardando Cliente', items: [] },
                'aguardandoPecas': { id: 'aguardandoPecas', title: 'Aguardando Peças', items: [] },
                'historico': { id: 'historico', title: 'Histórico', items: [] },
            };

            agendamentos.forEach(agendamento => {
                const columnId = statusToColumnId[agendamento.extendedProps.status];
                if (columnId && newColumns[columnId]) {
                    newColumns[columnId].items.push(agendamento);
                }
            });

            setColumns(newColumns);
        } catch (error) {
            console.error("Erro ao buscar agendamentos", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const handleWhatsAppClick = (event: React.MouseEvent, telefone: string | null, clienteNome: string) => {
        event.preventDefault();
        event.stopPropagation();

        if (!telefone) {
            alert('Este cliente não tem um número de telefone registrado.');
            return;
        }
        const numeroLimpo = telefone.replace(/\D/g, '');
        const mensagem = encodeURIComponent(`Olá ${clienteNome}, temos novidades sobre a sua Ordem de Serviço.`);
        window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
    };

    const handleOnDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const startColumn = columns[source.droppableId];
        const endColumn = columns[destination.droppableId];
        const item = startColumn.items.find(item => item.id === draggableId);

        if (!item) return;

        const columnIdToStatus: { [key: string]: string } = {
            'agendado': 'agendado',
            'emExecucao': 'em andamento',
            'aguardandoCliente': 'aguardando cliente',
            'aguardandoPecas': 'aguardando peça',
            'historico': 'concluido',
        };
        const newStatus = columnIdToStatus[destination.droppableId];

        const newStartItems = Array.from(startColumn.items);
        newStartItems.splice(source.index, 1);
        const newEndItems = Array.from(endColumn.items);
        newEndItems.splice(destination.index, 0, item);

        setColumns({
            ...columns,
            [source.droppableId]: { ...startColumn, items: newStartItems },
            [destination.droppableId]: { ...endColumn, items: newEndItems },
        });

        try {
            await api.patch(`/agendamentos/${draggableId}/status`, { status: newStatus });
        } catch (error) {
            alert('Falha ao atualizar o status. Revertendo a alteração.');
            setColumns({
                ...columns,
                [source.droppableId]: startColumn,
                [destination.droppableId]: endColumn,
            });
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">Carregando quadro Kanban...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6 text-texto-principal">Quadro de Serviços (Kanban)</h1>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    {Object.values(columns).map(column => (
                        <Droppable key={column.id} droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`p-4 rounded-lg bg-fundo-secundario border ${snapshot.isDraggingOver ? 'border-primaria-padrao' : 'border-borda'}`}
                                >
                                    <h2 className="text-lg font-semibold text-texto-principal mb-4">{column.title} ({column.items.length})</h2>
                                    <div className="space-y-3 min-h-[400px]">
                                        {column.items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <Link to={`/ordem-de-servico/${item.id}`} className="relative block">
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-4 rounded-md shadow-sm border-l-4 ${snapshot.isDragging ? 'bg-gray-200' : 'bg-white'} border-primaria-padrao hover:scale-105 transition-transform`}
                                                        >
                                                            <button
                                                                onClick={(e) => handleWhatsAppClick(e, item.extendedProps.cliente_telefone, item.extendedProps.cliente)}
                                                                className="absolute top-2 right-2 text-green-500 hover:text-green-400 z-10 p-1 rounded-full hover:bg-gray-100"
                                                                title="Contactar via WhatsApp"
                                                            >
                                                                <WhatsappIcon size={24} />
                                                            </button>
                                                            <p className="font-bold text-texto-principal pr-8">{item.extendedProps.cliente}</p>
                                                            <p className="text-sm text-texto-secundario">{item.extendedProps.servicos}</p>
                                                            <p className="text-xs text-right mt-2 font-mono text-gray-500">OS #{item.id}</p>
                                                        </div>
                                                    </Link>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}