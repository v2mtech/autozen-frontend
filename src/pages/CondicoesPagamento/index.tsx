import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

interface Condicao {
    id: number;
    nome: string;
    descricao?: string;
    status: 'ativo' | 'inativo';
}

export default function CondicoesPagamentoPage() {
    const [condicoes, setCondicoes] = useState<Condicao[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCondicao, setCurrentCondicao] = useState<Partial<Condicao>>({});
    const [isEditing, setIsEditing] = useState(false);

    const fetchCondicoes = async () => {
        const response = await api.get('/condicoes-pagamento');
        setCondicoes(response.data);
    };

    useEffect(() => {
        fetchCondicoes();
    }, []);

    const handleOpenModal = (condicao?: Condicao) => {
        if (condicao) {
            setCurrentCondicao(condicao);
            setIsEditing(true);
        } else {
            setCurrentCondicao({ status: 'ativo' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const { id, ...data } = currentCondicao;
        try {
            if (isEditing) {
                await api.put(`/condicoes-pagamento/${id}`, data);
            } else {
                await api.post('/condicoes-pagamento', data);
            }
            fetchCondicoes();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar condição de pagamento.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Condições de Pagamento</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Condição</Button>
            </div>
            <div className="bg-fundo-secundario rounded-lg shadow-md p-4">
                {condicoes.map(condicao => (
                    <div key={condicao.id} onClick={() => handleOpenModal(condicao)} className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-100">
                        <p className="font-bold">{condicao.nome}</p>
                        <p className="text-sm">{condicao.descricao}</p>
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Condição' : 'Nova Condição'}>
                <div className="space-y-4">
                    <Input label="Nome da Condição (Ex: 30/60/90 dias)" name="nome" value={currentCondicao.nome || ''} onChange={e => setCurrentCondicao({...currentCondicao, nome: e.target.value})} />
                    <Input label="Descrição" name="descricao" value={currentCondicao.descricao || ''} onChange={e => setCurrentCondicao({...currentCondicao, descricao: e.target.value})} />
                    <select name="status" value={currentCondicao.status || 'ativo'} onChange={e => setCurrentCondicao({...currentCondicao, status: e.target.value as 'ativo' | 'inativo'})}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}