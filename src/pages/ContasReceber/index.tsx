import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';

// Interfaces
interface Conta {
    id: number;
    descricao: string;
    cliente_nome: string;
    valor_total: number;
    data_vencimento: string;
    data_recebimento: string | null;
    status: 'Pendente' | 'Recebido' | 'Atrasado';
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function ContasReceberPage() {
    const [contas, setContas] = useState<Conta[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentConta, setCurrentConta] = useState<Partial<Conta>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/financeiro/contas-a-receber');
            setContas(response.data);
        } catch (error) {
            alert('Erro ao carregar contas a receber.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (conta: Conta) => {
        setCurrentConta({
            ...conta,
            data_recebimento: conta.data_recebimento ? getISODate(new Date(conta.data_recebimento)) : getISODate(new Date())
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const { id, ...data } = currentConta;
        try {
            await api.put(`/financeiro/contas-a-receber/${id}`, data);
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao atualizar a conta.');
        }
    };

    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Contas a Receber</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700"><tr><th className="p-4">Descrição</th><th className="p-4">Cliente</th><th className="p-4">Vencimento</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr></thead>
                    <tbody>
                        {contas.map(conta => (
                            <tr key={conta.id} onClick={() => handleOpenModal(conta)} className="border-b border-gray-700 cursor-pointer hover:bg-gray-800">
                                <td className="p-4 font-semibold">{conta.descricao}</td>
                                <td className="p-4">{conta.cliente_nome}</td>
                                <td className="p-4">{new Date(conta.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                <td className="p-4 font-mono">{Number(conta.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${conta.status === 'Recebido' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{conta.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Marcar Recebimento`}>
                <div className="space-y-4">
                    <Input label="Data de Recebimento" name="data_recebimento" type="date" value={currentConta.data_recebimento || ''} onChange={e => setCurrentConta(prev => ({ ...prev, data_recebimento: e.target.value, status: 'Recebido' }))} required />
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t"><Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button><Button onClick={handleSave}>Confirmar Recebimento</Button></div>
            </Modal>
        </div>
    );
}