import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsappIcon = FaWhatsapp as React.ElementType;

interface Orcamento {
    id: number;
    nome_cliente: string;
    descricao: string;
    status: 'solicitado' | 'em analise' | 'aguardando cliente' | 'aprovado' | 'cancelado' | 'devolvido';
    valor_total: number;
    cliente_telefone: string | null;
}
interface Cliente {
    id: number;
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
        try {
            const response = await api.get<Orcamento[]>('/orcamentos/empresa');

            const newColumns: Columns = {
                solicitados: { id: 'solicitados', title: 'Solicitações', items: [] },
                aguardando: { id: 'aguardando', title: 'Aguardando Cliente', items: [] },
                aprovados: { id: 'aprovados', title: 'Aprovados', items: [] },
                cancelados: { id: 'cancelados', title: 'Cancelados', items: [] },
            };

            response.data.forEach(orcamento => {
                if (orcamento.status === 'devolvido') {
                    newColumns.solicitados.items.push(orcamento);
                } else if (orcamento.status === 'solicitado' || orcamento.status === 'em analise') {
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
        try {
            const response = await api.get('/usuarios/list');
            setClientes(response.data);
        } catch (error) {
            console.error("Erro ao buscar clientes", error);
            alert("Não foi possível carregar a lista de clientes.");
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchOrcamentos(), fetchClientes()]).then(() => {
            setLoading(false);
        });
    }, []);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentOrcamento({});
    };

    const handleSaveOrcamento = async () => {
        if (!currentOrcamento.usuario_id) {
            alert("Por favor, selecione um cliente.");
            return;
        }
        try {
            await api.post('/orcamentos/empresa', currentOrcamento);
            handleCloseModal();
            fetchOrcamentos();
        } catch (error) {
            alert('Erro ao criar orçamento.');
        }
    };

    const handleWhatsAppClick = (event: React.MouseEvent, telefone: string | null, clienteNome: string) => {
        event.preventDefault();
        event.stopPropagation();
        if (!telefone) {
            alert('Este cliente não tem um número de telefone registado.');
            return;
        }
        const numeroLimpo = telefone.replace(/\D/g, '');
        const mensagem = encodeURIComponent(`Olá ${clienteNome}, temos novidades sobre o seu orçamento.`);
        window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
    };

    const handleOnDragEnd = (result: DropResult) => {
        console.log('Drag ended:', result);
    };

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
                                            <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                {(provided) => (
                                                    <Link to={`/orcamento/${item.id}`} className="relative block">
                                                        {item.status === 'devolvido' && (
                                                            <span className="absolute -top-2 -right-2 flex h-5 w-5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 justify-center items-center text-white text-xs">!</span>
                                                            </span>
                                                        )}
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`p-4 rounded-md shadow-sm bg-white border-l-4 ${item.status === 'devolvido' ? 'border-yellow-500' : 'border-primaria-padrao'} hover:scale-105 transition-transform`}>
                                                            <button
                                                                onClick={(e) => handleWhatsAppClick(e, item.cliente_telefone, item.nome_cliente)}
                                                                className="absolute top-2 right-2 text-green-500 hover:text-green-400 z-10 p-1 rounded-full hover:bg-gray-100"
                                                                title="Contactar via WhatsApp"
                                                            >
                                                                <WhatsappIcon size={24} />
                                                            </button>
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
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t">
                    <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSaveOrcamento} variant="primary">Enviar para Cliente</Button>
                </div>
            </Modal>
        </div>
    );
}