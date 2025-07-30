import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// --- INTERFACES ---
interface Orcamento {
    id: string; // ID do Firestore
    nome_cliente: string;
    descricao: string;
    status: 'solicitado' | 'em analise' | 'aguardando cliente' | 'aprovado' | 'cancelado';
    valor_total: number;
}

interface Column {
    id: string;
    title: string;
    items: Orcamento[];
}

interface Columns {
    [key: string]: Column;
}

// Mapeia o status do backend para o ID da nossa coluna no Kanban
const statusToColumnId: { [key: string]: string } = {
    'solicitado': 'solicitados',
    'em analise': 'solicitados',
    'aguardando cliente': 'solicitados',
    'aprovado': 'aprovados',
    'cancelado': 'cancelados',
};

export default function OrcamentosPage() {
    const { user } = useAuth();
    const [columns, setColumns] = useState<Columns>({
        solicitados: { id: 'solicitados', title: 'Orçamentos Solicitados', items: [] },
        aprovados: { id: 'aprovados', title: 'Orçamentos Aprovados (Viraram OS)', items: [] },
        cancelados: { id: 'cancelados', title: 'Orçamentos Cancelados', items: [] },
    });
    const [loading, setLoading] = useState(true);

    const fetchOrcamentos = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const orcamentosRef = collection(db, 'orcamentos');
            const q = query(orcamentosRef, where("empresa_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const orcamentosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orcamento));

            const newColumns: Columns = {
                solicitados: { id: 'solicitados', title: 'Orçamentos Solicitados', items: [] },
                aprovados: { id: 'aprovados', title: 'Aprovados (Viraram OS)', items: [] },
                cancelados: { id: 'cancelados', title: 'Cancelados', items: [] },
            };

            orcamentosList.forEach(orcamento => {
                const columnId = statusToColumnId[orcamento.status];
                if (columnId && newColumns[columnId]) {
                    newColumns[columnId].items.push(orcamento);
                }
            });

            setColumns(newColumns);
        } catch (error) {
            console.error("Erro ao buscar orçamentos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrcamentos();
    }, [user]);

    const handleOnDragEnd = (result: DropResult) => {
        // A lógica de arrastar para atualizar o status pode ser implementada aqui no futuro,
        // chamando a função `updateDoc` do Firestore.
        console.log('Drag ended:', result);
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar o quadro de orçamentos...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6 text-texto-principal">Kanban de Orçamentos</h1>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <Link to={`/orcamento/${item.id}`}>
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-4 rounded-md shadow-sm border-l-4 ${snapshot.isDragging ? 'bg-gray-200' : 'bg-white'} ${column.id === 'aprovados' ? 'border-green-500' : 'border-primaria-padrao'}`}
                                                            style={{ ...provided.draggableProps.style }}
                                                        >
                                                            <p className="font-bold text-texto-principal">{item.nome_cliente}</p>
                                                            <p className="text-sm text-texto-secundario truncate">{item.descricao}</p>
                                                            <p className="text-right mt-2 font-bold text-lg text-primaria-escuro">{Number(item.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
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