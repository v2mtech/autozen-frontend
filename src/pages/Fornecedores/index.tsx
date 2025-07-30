import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { MaskedInput } from '../../components/MaskedInput';
import { collection, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Fornecedor {
    id: string; // ID do Firestore
    nome_fantasia: string;
    razao_social: string;
    cnpj_cpf: string;
    status: 'ativo' | 'inativo';
    // Outros campos
}

export default function FornecedoresPage() {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFornecedor, setCurrentFornecedor] = useState<Partial<Fornecedor>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFornecedores = async () => {
        setLoading(true);
        try {
            const fornecedoresRef = collection(db, 'fornecedores');
            const querySnapshot = await getDocs(fornecedoresRef);
            const fornecedoresList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fornecedor));
            setFornecedores(fornecedoresList);
        } catch (error) {
            alert('Erro ao carregar fornecedores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFornecedores();
    }, []);

    const handleOpenModal = (fornecedor?: Fornecedor) => {
        if (fornecedor) {
            setCurrentFornecedor(fornecedor);
            setIsEditing(true);
        } else {
            setCurrentFornecedor({ status: 'ativo' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCurrentFornecedor({ ...currentFornecedor, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const { id, ...data } = currentFornecedor;
        try {
            if (isEditing && id) {
                const fornecedorRef = doc(db, 'fornecedores', id);
                await updateDoc(fornecedorRef, data);
            } else {
                await addDoc(collection(db, 'fornecedores'), data);
            }
            fetchFornecedores();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar fornecedor.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Fornecedores</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Fornecedor</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-sm border border-borda overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Nome Fantasia</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">CNPJ/CPF</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {fornecedores.map(fornecedor => (
                            <tr key={fornecedor.id} onClick={() => handleOpenModal(fornecedor)} className="cursor-pointer hover:bg-fundo-principal">
                                <td className="p-4 font-semibold text-texto-principal">{fornecedor.nome_fantasia}</td>
                                <td className="p-4 text-texto-secundario">{fornecedor.cnpj_cpf}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${fornecedor.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {fornecedor.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input label="Nome Fantasia" name="nome_fantasia" value={currentFornecedor.nome_fantasia || ''} onChange={handleChange} required />
                    <Input label="Razão Social" name="razao_social" value={currentFornecedor.razao_social || ''} onChange={handleChange} />
                    <MaskedInput label="CNPJ / CPF" name="cnpj_cpf" mask="00.000.000/0000-00" placeholder="00.000.000/0000-00" value={currentFornecedor.cnpj_cpf || ''} onChange={handleChange} required />
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                        <select name="status" value={currentFornecedor.status || 'ativo'} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}