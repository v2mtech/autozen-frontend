import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const WhatsappIcon = FaWhatsapp as React.ElementType;

interface Orcamento {
    id: string;
    nome_cliente: string;
    descricao: string;
    status: 'solicitado' | 'em analise' | 'aguardando cliente' | 'aprovado' | 'cancelado' | 'devolvido';
    valor_total: number;
    cliente_telefone: string | null;
}
interface Cliente {
    id: string;
    nome: string;
}

interface Column {
    id: string;
    title: string;
    items: Orcamento[];
}

interface Columns {
    [key: string]: Column;
}

export default function OrcamentosKanbanPage() {
    const { user } = useAuth();
    const [columns, setColumns] = useState<Columns>({
        solicitados: { id: 'solicitados', title: 'Solicitações', items: [] },
        aguardando: { id: 'aguardando', title: 'Aguardando Cliente', items: [] },
        aprovados: { id: 'aprovados', title: 'Aprovados', items: [] },
        cancelados: { id: 'cancelados', title: 'Cancelados', items: [] },
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOrcamento, setCurrentOrcamento] = useState<any>({});
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrcamentos = async () => {
        if (!user) return;
        try {
            const orcamentosRef = collection(db, 'orcamentos');
            const q = query(orcamentosRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            const orcamentosList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orcamento));

            const newColumns: Columns = {
                solicitados: { id: 'solicitados', title: 'Solicitações', items: [] },
                aguardando: { id: 'aguardando', title: 'Aguardando Cliente', items: [] },
                aprovados: { id: 'aprovados', title: 'Aprovados', items: [] },
                cancelados: { id: 'cancelados', title: 'Cancelados', items: [] },
            };

            orcamentosList.forEach(orcamento => {
                if (orcamento.status === 'devolvido' || orcamento.status === 'solicitado' || orcamento.status === 'em analise') {
                    newColumns.solicitados.items.push(orcamento);
                } else if (orcamento.status === 'aguardando cliente') {
                    newColumns.aguardando.items.push(orcamento);
                } else if (orcamento.status === 'aprovado') {
                    newColumns.aprovados.items.push(orcamento);
                } else if (orcamento.status === 'cancelado') {
                    newColumns.cancelados.items.push(orcamento);
                }
            });
            setColumns(newColumns);
        } catch (error) {
            console.error("Erro ao buscar orçamentos", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientes = async () => {
        if (!user) return;
        try {
            const clientesRef = collection(db, 'usuarios');
            const snap = await getDocs(clientesRef);
            setClientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente)));
        } catch (error) {
            alert("Não foi possível carregar a lista de clientes.");
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchOrcamentos(), fetchClientes()]).then(() => {
            setLoading(false);
        });
    }, [user]);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentOrcamento({});
    };

    const handleSaveOrcamento = async () => {
        if (!user || !currentOrcamento.usuario_id) {
            alert("Por favor, selecione um cliente.");
            return;
        }
        try {
            const clienteSelecionado = clientes.find(c => c.id === currentOrcamento.usuario_id);
            const dataToSend = {
                ...currentOrcamento,
                empresa_id: user.uid,
                nome_cliente: clienteSelecionado?.nome,
                status: 'aguardando cliente',
                data_orcamento: new Date(),
            };
            await addDoc(collection(db, 'orcamentos'), dataToSend);
            handleCloseModal();
            fetchOrcamentos();
        } catch (error) {
            alert('Erro ao criar orçamento.');
        }
    };

    const handleOnDragEnd = (result: DropResult) => { console.log('Drag ended:', result); };

    if (loading) return <p className="text-center text-texto-secundario">A carregar o quadro de orçamentos...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Kanban de Orçamentos</h1>
                <Button onClick={handleOpenModal} className="w-auto">Criar Orçamento</Button>
            </div>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {Object.values(columns).map(column => (
                        <Droppable key={column.id} droppableId={column.id}>
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="p-4 rounded-lg bg-fundo-secundario border border-borda">
                                    <h2 className="text-lg font-semibold text-texto-principal mb-4">{column.title} ({column.items.length})</h2>
                                    <div className="space-y-3 min-h-[400px]">
                                        {column.items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided) => (
                                                    <Link to={`/orcamento/${item.id}`} className="relative block">
                                                        {item.status === 'devolvido' && (
                                                            <span className="absolute -top-2 -right-2 flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 justify-center items-center text-white text-xs">!</span></span>
                                                        )}
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`p-4 rounded-md shadow-sm bg-white border-l-4 ${item.status === 'devolvido' ? 'border-yellow-500' : 'border-primaria-padrao'} hover:scale-105 transition-transform`}>
                                                            <p className="font-bold text-texto-principal pr-8">{item.nome_cliente}</p>
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
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Criar Novo Orçamento" maxWidthClass="max-w-4xl">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Cliente</label>
                        <select name="usuario_id" onChange={e => setCurrentOrcamento({ ...currentOrcamento, usuario_id: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                            <option value="">Selecione um Cliente</option>
                            {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Descrição</label>
                        <textarea name="descricao" onChange={e => setCurrentOrcamento({ ...currentOrcamento, descricao: e.target.value })} placeholder="Descrição detalhada do orçamento..." className="w-full p-2 border rounded-lg bg-white" rows={4}></textarea>
                    </div>
                    <Input label="Valor Total (R$)" name="valor_total" type="number" step="0.01" onChange={e => setCurrentOrcamento({ ...currentOrcamento, valor_total: e.target.value })} />
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda">
                    <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSaveOrcamento} variant="primary">Enviar para Cliente</Button>
                </div>
            </Modal>
        </div>
    );
}