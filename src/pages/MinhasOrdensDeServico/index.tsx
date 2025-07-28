import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interfaces
interface OrdemServicoConcluida {
    id: number;
    data_hora_inicio: string;
    empresa_nome_fantasia: string;
    valor_total: number;
}

const formatDateTime = (date: string) => new Date(date).toLocaleString('pt-BR');
const formatCurrency = (value: number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MinhasOrdensDeServicoPage() {
    const [ordens, setOrdens] = useState<OrdemServicoConcluida[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrdensConcluidas = async () => {
            try {
                const response = await api.get('/agendamentos/meus-concluidos');
                setOrdens(response.data);
            } catch (error) {
                console.error("Erro ao buscar Ordens de Serviço", error);
                alert("Não foi possível carregar as suas Ordens de Serviço.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrdensConcluidas();
    }, []);

    const handleGeneratePDF = async (osId: number) => {
        try {
            const response = await api.get(`/agendamentos/${osId}/detalhes`);
            const os = response.data;

            const doc = new jsPDF();
            const osIdStr = String(os.id).padStart(6, '0');
            const dataInicio = new Date(os.data_hora_inicio).toLocaleString('pt-BR');

            // Cabeçalho do PDF
            doc.setFontSize(20);
            doc.text(`Ordem de Serviço #${osIdStr}`, 14, 22);
            
            doc.setFontSize(10);
            doc.text(`${os.empresa_nome} (${os.empresa_razao_social})`, 14, 30);
            doc.text(`CNPJ: ${os.empresa_cnpj}`, 14, 35);
            
            // Dados do Cliente e Serviço
            autoTable(doc, {
                startY: 45,
                head: [['CLIENTE', 'DATA DO SERVIÇO']],
                body: [[os.usuario_nome, dataInicio]],
                theme: 'striped'
            });

            // Tabela de Serviços
            const finalY = (doc as any).lastAutoTable.finalY;
            doc.setFontSize(14);
            doc.text("Serviços Realizados", 14, finalY + 15);
            autoTable(doc, {
                startY: finalY + 20,
                head: [['Descrição', 'Duração (min)', 'Valor (R$)']],
                body: os.servicos.map((s: any) => [
                    s.nome, 
                    s.duracao_minutos,
                    parseFloat(s.preco).toFixed(2)
                ]),
                theme: 'grid',
                headStyles: { fillColor: [44, 62, 80] },
                foot: [['Total', '', parseFloat(os.servicos.reduce((acc: number, s: any) => acc + parseFloat(s.preco), 0)).toFixed(2)]],
                footStyles: { fontStyle: 'bold' }
            });
            
            doc.save(`OS_${osIdStr}_${os.usuario_nome}.pdf`);

        } catch (error) {
            alert("Erro ao gerar o PDF da Ordem de Serviço.");
        }
    };

    if (loading) return <p>A carregar as suas Ordens de Serviço...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white">Minhas Ordens de Serviço</h1>
            <p className="text-gray-400 mb-8">Aqui está o histórico de todos os seus serviços concluídos.</p>
            <div className="bg-fundo-secundario rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-4">OS #</th>
                            <th className="p-4">Estabelecimento</th>
                            <th className="p-4">Data</th>
                            <th className="p-4">Valor Total</th>
                            <th className="p-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordens.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-500">Nenhuma Ordem de Serviço concluída encontrada.</td></tr>
                        ) : (
                            ordens.map(os => (
                                <tr key={os.id} className="border-b border-gray-700 last:border-b-0">
                                    <td className="p-4 font-mono">#{String(os.id).padStart(6, '0')}</td>
                                    <td className="p-4">{os.empresa_nome_fantasia}</td>
                                    <td className="p-4">{formatDateTime(os.data_hora_inicio)}</td>
                                    <td className="p-4">{formatCurrency(os.valor_total)}</td>
                                    <td className="p-4">
                                        <Button onClick={() => handleGeneratePDF(os.id)} className="w-auto py-1 px-3 text-sm">
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