import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Condicao {
    id: string;
    nome: string;
    descricao?: string;
    status: 'ativo' | 'inativo';
}

export default function CondicoesPagamentoPage() {
    const { user } = useAuth();
    const [condicoes, setCondicoes] = useState<Condicao[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCondicao, setCurrentCondicao] = useState<Partial<Condicao>>({});
    const [isEditing, setIsEditing] = useState(false);

    const fetchCondicoes = async () => {
        if (!user) return;
        try {
            const condRef = collection(db, 'condicoes_pagamento');
            const q = query(condRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            setCondicoes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Condicao)));
        } catch (error) {
            alert('Erro ao carregar condições de pagamento.');
        }
    };

    useEffect(() => {
        fetchCondicoes();
    }, [user]);

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
        if (!user) return;
        const { id, ...data } = currentCondicao;
        const dataToSave = { ...data, empresa_id: user.uid };
        try {
            if (isEditing && id) {
                await updateDoc(doc(db, 'condicoes_pagamento', id), dataToSave);
            } else {
                await addDoc(collection(db, 'condicoes_pagamento'), dataToSave);
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
                <h1 className="text-4xl font-bold text-texto-principal">Condições de Pagamento</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Condição</Button>
            </div>
            <div className="bg-fundo-secundario rounded-lg shadow-sm p-4 border border-borda">
                {condicoes.map(condicao => (
                    <div key={condicao.id} onClick={() => handleOpenModal(condicao)} className="p-3 border-b border-borda last:border-b-0 cursor-pointer hover:bg-fundo-principal">
                        <p className="font-bold text-texto-principal">{condicao.nome}</p>
                        <p className="text-sm text-texto-secundario">{condicao.descricao}</p>
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Condição' : 'Nova Condição'}>
                <div className="space-y-4">
                    <Input label="Nome da Condição (Ex: 30/60/90 dias)" name="nome" value={currentCondicao.nome || ''} onChange={e => setCurrentCondicao({ ...currentCondicao, nome: e.target.value })} />
                    <Input label="Descrição" name="descricao" value={currentCondicao.descricao || ''} onChange={e => setCurrentCondicao({ ...currentCondicao, descricao: e.target.value })} />
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                        <select name="status" value={currentCondicao.status || 'ativo'} onChange={e => setCurrentCondicao({ ...currentCondicao, status: e.target.value as 'ativo' | 'inativo' })} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}