import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';

interface Fornecedor { id: number; nome_fantasia: string; }
interface Conta {
    id: number;
    descricao: string;
    fornecedor_id: number | null;
    fornecedor_nome?: string;
    categoria: string;
    valor: number;
    data_vencimento: string;
    data_pagamento: string | null;
    status: 'Pendente' | 'Pago' | 'Atrasado';
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function ContasPagarPage() {
    const [contas, setContas] = useState<Conta[]>([]);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentConta, setCurrentConta] = useState<Partial<Conta>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contasRes, fornecedoresRes] = await Promise.all([
                api.get('/financeiro/contas-a-pagar'),
                api.get('/fornecedores')
            ]);
            setContas(contasRes.data);
            setFornecedores(fornecedoresRes.data);
        } catch (error) {
            alert('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (conta?: Conta) => {
        if (conta) {
            setCurrentConta({
                ...conta,
                data_vencimento: getISODate(new Date(conta.data_vencimento)),
                data_pagamento: conta.data_pagamento ? getISODate(new Date(conta.data_pagamento)) : null
            });
            setIsEditing(true);
        } else {
            setCurrentConta({ status: 'Pendente', data_vencimento: getISODate(new Date()) });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentConta(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const { id, fornecedor_nome, ...data } = currentConta;
        try {
            if (isEditing) {
                await api.put(`/financeiro/contas-a-pagar/${id}`, data);
            } else {
                await api.post('/financeiro/contas-a-pagar', data);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar a conta.');
        }
    };

    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Contas a Pagar</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Despesa</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700"><tr><th className="p-4">Descrição</th><th className="p-4">Fornecedor</th><th className="p-4">Vencimento</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr></thead>
                    <tbody>
                        {contas.map(conta => (
                            <tr key={conta.id} onClick={() => handleOpenModal(conta)} className="border-b border-gray-700 cursor-pointer hover:bg-gray-800">
                                <td className="p-4 font-semibold">{conta.descricao}</td>
                                <td className="p-4">{conta.fornecedor_nome || 'Diversos'}</td>
                                <td className="p-4">{new Date(conta.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                <td className="p-4 font-mono">{Number(conta.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${conta.status === 'Pago' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{conta.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Despesa' : 'Nova Despesa'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Descrição" name="descricao" value={currentConta.descricao || ''} onChange={handleChange} required className="md:col-span-2" />
                    <Input label="Categoria" name="categoria" value={currentConta.categoria || ''} onChange={handleChange} placeholder="Ex: Aluguel, Fornecedores" />
                    <Input label="Valor (R$)" name="valor" type="number" step="0.01" value={currentConta.valor || ''} onChange={handleChange} required />
                    <Input label="Data de Vencimento" name="data_vencimento" type="date" value={currentConta.data_vencimento || ''} onChange={handleChange} required />
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                        <select name="status" value={currentConta.status || 'Pendente'} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                            <option>Pendente</option><option>Pago</option>
                        </select>
                    </div>
                    {currentConta.status === 'Pago' && (
                        <Input label="Data de Pagamento" name="data_pagamento" type="date" value={currentConta.data_pagamento || ''} onChange={handleChange} />
                    )}
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Fornecedor (Opcional)</label>
                        <select name="fornecedor_id" value={currentConta.fornecedor_id || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                            <option value="">Nenhum / Diversos</option>
                            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t"><Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button><Button onClick={handleSave}>Guardar</Button></div>
            </Modal>
        </div>
    );
}