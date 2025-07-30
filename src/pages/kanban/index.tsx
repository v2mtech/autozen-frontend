import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '../../components/Button';

// ✅ Funções do Firebase
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';

const WhatsappIcon = FaWhatsapp as React.ElementType;

interface Agendamento {
    id: string;
    usuario_nome: string;
    servicos_nomes: string;
    status: string;
    usuario_telefone: string | null;
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
    const { user } = useAuth();
    const [columns, setColumns] = useState<Columns>({
        'agendado': { id: 'agendado', title: 'Agendado', items: [] },
        'emExecucao': { id: 'emExecucao', title: 'Em Execução', items: [] },
        'aguardandoCliente': { id: 'aguardandoCliente', title: 'Aguardando Cliente', items: [] },
        'aguardandoPecas': { id: 'aguardandoPecas', title: 'Aguardando Peças', items: [] },
        'historico': { id: 'historico', title: 'Histórico', items: [] },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAgendamentos = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // ✅ Lógica refatorada para buscar dados do Firestore
            const agendamentosRef = collection(db, 'agendamentos');
            const q = query(agendamentosRef, where("empresa_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const agendamentos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Agendamento[];

            const newColumns: Columns = {
                'agendado': { id: 'agendado', title: 'Agendado', items: [] },
                'emExecucao': { id: 'emExecucao', title: 'Em Execução', items: [] },
                'aguardandoCliente': { id: 'aguardandoCliente', title: 'Aguardando Cliente', items: [] },
                'aguardandoPecas': { id: 'aguardandoPecas', title: 'Aguardando Peças', items: [] },
                'historico': { id: 'historico', title: 'Histórico', items: [] },
            };

            agendamentos.forEach(agendamento => {
                const columnId = statusToColumnId[agendamento.status];
                if (columnId && newColumns[columnId]) {
                    newColumns[columnId].items.push(agendamento);
                }
            });
            setColumns(newColumns);
        } catch (err) {
            console.error("Erro ao buscar agendamentos:", err);
            setError('Não foi possível carregar os dados do quadro.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const handleOnDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const startColumn = columns[source.droppableId];
        const endColumn = columns[destination.droppableId];
        if (startColumn === endColumn && source.index === destination.index) return;

        const item = startColumn.items.find(item => item.id === draggableId);
        if (!item) return;

        // Atualiza o estado visualmente de forma otimista
        const newStartItems = Array.from(startColumn.items);
        newStartItems.splice(source.index, 1);
        const newEndItems = Array.from(endColumn.items);
        newEndItems.splice(destination.index, 0, item);
        setColumns(prev => ({
            ...prev,
            [source.droppableId]: { ...startColumn, items: newStartItems },
            [destination.droppableId]: { ...endColumn, items: newEndItems },
        }));

        // ✅ Lógica refatorada para atualizar o status no Firestore
        const columnIdToStatus: { [key: string]: string } = {
            'agendado': 'agendado',
            'emExecucao': 'em andamento',
            'aguardandoCliente': 'aguardando cliente',
            'aguardandoPecas': 'aguardando peça',
        };
        const newStatus = columnIdToStatus[destination.droppableId];

        if (newStatus) { // Apenas atualiza se não for para a coluna de histórico
            try {
                const agendamentoRef = doc(db, 'agendamentos', draggableId);
                await updateDoc(agendamentoRef, { status: newStatus });
            } catch (error) {
                alert('Falha ao atualizar o status. Revertendo a alteração.');
                setColumns(prev => ({ // Reverte o estado em caso de erro
                    ...prev,
                    [source.droppableId]: startColumn,
                    [destination.droppableId]: endColumn,
                }));
            }
        }
    };

    if (loading) return <p className="text-center text-texto-secundario p-10">A carregar o quadro Kanban...</p>;
    if (error) return <div className="bg-red-100 text-erro p-8 rounded-lg text-center"><h2 className="text-2xl font-bold mb-2">Ocorreu um Erro</h2><p>{error}</p><Button onClick={fetchAgendamentos} className="mt-4 w-auto">Tentar Novamente</Button></div>;

    // O JSX permanece o mesmo, apenas a lógica de busca e atualização de dados mudou.
    return (
        <div>
            <h1 className="text-4xl font-bold mb-6 text-texto-principal">Quadro de Serviços (Kanban)</h1>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    {Object.values(columns).map(column => (
                        <Droppable key={column.id} droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className={`p-4 rounded-lg bg-fundo-secundario border ${snapshot.isDraggingOver ? 'border-primaria-padrao' : 'border-borda'}`}>
                                    <h2 className="text-lg font-semibold text-texto-principal mb-4">{column.title} ({column.items.length})</h2>
                                    <div className="space-y-3 min-h-[400px]">
                                        {column.items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                {(provided) => (
                                                    <Link to={`/ordem-de-servico/${item.id}`} className="relative block">
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="p-4 rounded-md shadow-sm border-l-4 bg-white border-primaria-padrao hover:scale-105 transition-transform">
                                                            <p className="font-bold text-texto-principal pr-8">{item.usuario_nome}</p>
                                                            <p className="text-sm text-texto-secundario">{item.servicos_nomes}</p>
                                                            <p className="text-xs text-right mt-2 font-mono text-gray-500">OS #{item.id.substring(0, 6)}</p>
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