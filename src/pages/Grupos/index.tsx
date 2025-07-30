import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Grupo {
    id: string;
    nome: string;
    codigo: string;
    descricao: string;
    classificacao: string;
}

export default function GruposPage() {
    const { user } = useAuth();
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGrupo, setCurrentGrupo] = useState<Partial<Grupo>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const gruposRef = collection(db, 'produto_grupos');
            const q = query(gruposRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            setGrupos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grupo)));
        } catch (error) {
            alert('Erro ao carregar dados da página.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleOpenModal = (grupo?: Grupo) => {
        if (grupo) {
            setCurrentGrupo(grupo);
            setIsEditing(true);
        } else {
            setCurrentGrupo({});
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentGrupo(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        const { id, ...data } = currentGrupo;
        const dataToSave = { ...data, empresa_id: user.uid };
        try {
            if (isEditing && id) {
                await updateDoc(doc(db, 'produto_grupos', id), dataToSave);
            } else {
                await addDoc(collection(db, 'produto_grupos'), dataToSave);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar grupo.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Grupos de Produtos</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Grupo</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-sm p-4 border border-borda">
                {grupos.map(grupo => (
                    <div key={grupo.id} onClick={() => handleOpenModal(grupo)} className="p-3 border-b border-borda last:border-b-0 cursor-pointer hover:bg-fundo-principal">
                        <p className="font-bold text-texto-principal">{grupo.nome}</p>
                        <p className="text-sm text-texto-secundario">{grupo.descricao}</p>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Grupo' : 'Novo Grupo'}>
                <div className="space-y-4">
                    <Input label="Nome" name="nome" value={currentGrupo.nome || ''} onChange={handleChange} />
                    <Input label="Código" name="codigo" value={currentGrupo.codigo || ''} onChange={handleChange} />
                    <Input label="Descrição" name="descricao" value={currentGrupo.descricao || ''} onChange={handleChange} />
                    <Input label="Classificação" name="classificacao" value={currentGrupo.classificacao || ''} onChange={handleChange} />
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}