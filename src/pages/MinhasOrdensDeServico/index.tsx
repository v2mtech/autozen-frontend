import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Interfaces
interface OrdemServicoConcluida {
    id: string;
    data_hora_inicio: { toDate: () => Date };
    empresa_nome_fantasia: string;
    valor_total: number;
}

const formatDateTime = (date: Date) => date.toLocaleString('pt-BR');
const formatCurrency = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MinhasOrdensDeServicoPage() {
    const { user } = useAuth();
    const [ordens, setOrdens] = useState<OrdemServicoConcluida[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrdensConcluidas = async () => {
            if (!user) return;
            try {
                const osRef = collection(db, 'agendamentos');
                const q = query(osRef, where("usuario_id", "==", user.uid), where("status", "==", "concluido"));
                const snap = await getDocs(q);
                const osList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrdemServicoConcluida));
                setOrdens(osList);
            } catch (error) {
                console.error("Erro ao buscar Ordens de Serviço", error);
                alert("Não foi possível carregar as suas Ordens de Serviço.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrdensConcluidas();
    }, [user]);

    const handleGeneratePDF = async (osId: string) => {
        try {
            // A lógica de gerar PDF agora precisa buscar os detalhes do Firestore.
            // O ideal é que esta lógica complexa seja uma Cloud Function.
            alert("A funcionalidade de gerar PDF será migrada para uma Cloud Function.");

            // Exemplo de como a busca de dados seria:
            const osRef = doc(db, 'agendamentos', osId);
            const osSnap = await getDoc(osRef);
            if (!osSnap.exists()) {
                throw new Error("OS não encontrada");
            }
            const os = osSnap.data();
            console.log("Dados da OS para o PDF:", os);
            // Aqui entraria a lógica de criação do PDF com os dados de 'os'.

        } catch (error) {
            alert("Erro ao gerar o PDF da Ordem de Serviço.");
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar as suas Ordens de Serviço...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-texto-principal">Minhas Ordens de Serviço</h1>
            <p className="text-texto-secundario mb-8">Aqui está o histórico de todos os seus serviços concluídos.</p>
            <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">OS #</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Estabelecimento</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Valor Total</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {ordens.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-8 text-texto-secundario">Nenhuma Ordem de Serviço concluída encontrada.</td></tr>
                        ) : (
                            ordens.map(os => (
                                <tr key={os.id} className="hover:bg-fundo-principal">
                                    <td className="p-4 font-mono text-primaria-padrao font-medium">#{os.id.substring(0, 6)}</td>
                                    <td className="p-4 text-texto-principal">{os.empresa_nome_fantasia}</td>
                                    <td className="p-4 text-texto-secundario">{formatDateTime(os.data_hora_inicio.toDate())}</td>
                                    <td className="p-4 text-texto-principal">{formatCurrency(os.valor_total)}</td>
                                    <td className="p-4">
                                        <Button onClick={() => handleGeneratePDF(os.id)} variant="secondary" className="!py-1 !px-3 !text-xs !w-auto">
                                            Ver / Baixar PDF
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}