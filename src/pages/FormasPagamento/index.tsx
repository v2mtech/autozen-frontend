import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { bandeirasCartao, bancosBrasil } from '../../data/paymentData';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface FormaPagamento {
    id: string;
    nome: string;
    tipo: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX';
    bandeiras?: string;
    taxa?: number;
    status: 'ativo' | 'inativo';
}

interface FormaPagamentoForm extends Omit<FormaPagamento, 'bandeiras' | 'id'> {
    id?: string;
    bandeiras?: string[];
}

export default function FormasPagamentoPage() {
    const { user } = useAuth();
    const [formas, setFormas] = useState<FormaPagamento[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentForma, setCurrentForma] = useState<Partial<FormaPagamentoForm>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFormas = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const formasRef = collection(db, 'formas_pagamento');
            const q = query(formasRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            const formasList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormaPagamento));
            setFormas(formasList);
        } catch (error) {
            alert('Erro ao carregar formas de pagamento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFormas();
    }, [user]);

    const handleOpenModal = (forma?: FormaPagamento) => {
        if (forma) {
            const bandeirasArray = typeof forma.bandeiras === 'string' ? forma.bandeiras.split(',') : [];
            setCurrentForma({ ...forma, bandeiras: bandeirasArray });
            setIsEditing(true);
        } else {
            setCurrentForma({ tipo: 'Dinheiro', status: 'ativo', bandeiras: [] });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentForma(prev => ({ ...prev, [name]: value }));
    };

    const handleBandeiraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const currentBandeiras = currentForma.bandeiras || [];
        if (checked) {
            setCurrentForma(prev => ({ ...prev, bandeiras: [...currentBandeiras, value] }));
        } else {
            setCurrentForma(prev => ({ ...prev, bandeiras: currentBandeiras.filter(b => b !== value) }));
        }
    };

    const handleSave = async () => {
        if (!user) return;
        const { id, ...data } = currentForma;
        const dataToSend = {
            ...data,
            empresa_id: user.uid,
            bandeiras: data.bandeiras?.join(','),
        };

        try {
            if (isEditing && id) {
                const formaRef = doc(db, 'formas_pagamento', id);
                await updateDoc(formaRef, dataToSend);
            } else {
                await addDoc(collection(db, 'formas_pagamento'), dataToSend);
            }
            fetchFormas();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar a forma de pagamento.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Formas de Pagamento</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Forma</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-sm border border-borda overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Nome</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Tipo</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Taxa (%)</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {formas.map(forma => (
                            <tr key={forma.id} onClick={() => handleOpenModal(forma)} className="cursor-pointer hover:bg-fundo-principal">
                                <td className="p-4 font-semibold text-texto-principal">{forma.nome}</td>
                                <td className="p-4 text-texto-secundario">{forma.tipo}</td>
                                <td className="p-4 text-texto-secundario">{forma.taxa ? `${Number(forma.taxa).toFixed(2)}%` : '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${forma.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {forma.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'} maxWidthClass="max-w-3xl">
                <div className="space-y-4">
                    <Input label="Nome (Ex: Crédito Loja, Pix Gerente)" name="nome" value={currentForma.nome || ''} onChange={handleChange} required />
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Tipo</label>
                        <select name="tipo" value={currentForma.tipo} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option>Dinheiro</option>
                            <option>Cartão de Crédito</option>
                            <option>Cartão de Débito</option>
                            <option>PIX</option>
                        </select>
                    </div>

                    {(currentForma.tipo === 'Cartão de Crédito' || currentForma.tipo === 'Cartão de Débito') && (
                        <div className="border-t pt-4 border-borda">
                            <label className="text-sm font-semibold text-texto-secundario">Bandeiras Aceites</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {bandeirasCartao.map(bandeira => (
                                    <label key={bandeira} className="flex items-center space-x-2 p-2 rounded-md hover:bg-fundo-principal">
                                        <input
                                            type="checkbox"
                                            value={bandeira}
                                            checked={currentForma.bandeiras?.includes(bandeira)}
                                            onChange={handleBandeiraChange}
                                            className="h-4 w-4 rounded text-primaria-padrao focus:ring-primaria-padrao"
                                        />
                                        <span className="text-texto-principal">{bandeira}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <Input label="Taxa (%)" name="taxa" type="number" step="0.01" value={currentForma.taxa || ''} onChange={handleChange} />
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                        <select name="status" value={currentForma.status || 'ativo'} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
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