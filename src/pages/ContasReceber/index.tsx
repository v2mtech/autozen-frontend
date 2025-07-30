import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useEffect, useState } from 'react';

// --- INTERFACES ---
interface ContaFirestore {
    id: string;
    descricao: string;
    cliente_nome: string;
    valor_total: number;
    data_vencimento: { toDate: () => Date };
    data_recebimento: { toDate: () => Date } | null;
    status: 'Pendente' | 'Recebido' | 'Atrasado';
}

// Interface para o estado do formulário, que usa strings para as datas
interface ContaForm {
    id?: string;
    descricao?: string;
    cliente_nome?: string;
    valor_total?: number;
    data_vencimento?: string;
    data_recebimento?: string | null;
    status?: 'Pendente' | 'Recebido' | 'Atrasado';
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function ContasReceberPage() {
    const { user } = useAuth();
    const [contas, setContas] = useState<ContaFirestore[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentConta, setCurrentConta] = useState<Partial<ContaForm>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const contasRef = collection(db, 'contas_receber');
            const q = query(contasRef, where("empresa_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const contasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaFirestore));
            setContas(contasList);
        } catch (error) {
            alert('Erro ao carregar contas a receber.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleOpenModal = (conta: ContaFirestore) => {
        // Converte as datas do Firestore para strings no formato YYYY-MM-DD para o formulário
        setCurrentConta({
            ...conta,
            data_vencimento: getISODate(conta.data_vencimento.toDate()),
            data_recebimento: conta.data_recebimento ? getISODate(conta.data_recebimento.toDate()) : getISODate(new Date())
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const { id, ...data } = currentConta;
        if (!id) return;

        // Converte a string da data de volta para um objeto Date antes de salvar
        const dataToSave = {
            status: 'Recebido',
            data_recebimento: data.data_recebimento ? new Date(data.data_recebimento) : new Date()
        };

        try {
            const contaRef = doc(db, 'contas_receber', id);
            await updateDoc(contaRef, dataToSave);
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao atualizar a conta.');
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Contas a Receber</h1>

            <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Descrição</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Cliente</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Vencimento</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Valor</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {contas.map(conta => (
                            <tr key={conta.id} onClick={() => conta.status !== 'Recebido' && handleOpenModal(conta)} className={`cursor-pointer hover:bg-fundo-principal`}>
                                <td className="p-4 font-medium text-texto-principal">{conta.descricao}</td>
                                <td className="p-4 text-texto-secundario">{conta.cliente_nome}</td>
                                <td className="p-4 text-texto-secundario">{conta.data_vencimento.toDate().toLocaleDateString('pt-BR')}</td>
                                <td className="p-4 text-texto-principal font-mono">{Number(conta.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${conta.status === 'Recebido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>{conta.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Marcar Recebimento`}>
                <div className="space-y-4">
                    <p className="text-texto-secundario">Marcar a conta <strong className="text-texto-principal">{currentConta.descricao}</strong> como recebida?</p>
                    <Input
                        label="Data de Recebimento"
                        name="data_recebimento"
                        type="date"
                        value={currentConta.data_recebimento || ''}
                        onChange={e => setCurrentConta(prev => ({ ...prev, data_recebimento: e.target.value, status: 'Recebido' }))}
                        required
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave}>Confirmar Recebimento</Button>
                </div>
            </Modal>
        </div>
    );
}