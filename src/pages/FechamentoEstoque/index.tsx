import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FaQuestionCircle } from 'react-icons/fa';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';

const QuestionIcon = FaQuestionCircle as React.ElementType;

const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            {text}
        </div>
    </div>
);

interface EstoqueItem { id: string; nome: string; quantidade_atual: number; }
interface ResultadoInventario {
    id: string;
    nome: string;
    quantidade_sistema: number;
    contagem: number;
    diferenca: number;
}

export default function FechamentoEstoquePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<ResultadoInventario[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleExport = async (format: 'xlsx' | 'csv') => {
        if (!user) return;
        setLoading(true);
        try {
            // Busca os produtos e seus estoques do Firestore
            const produtosRef = collection(db, 'produtos');
            const qProdutos = query(produtosRef, where("empresa_id", "==", user.uid));
            const produtosSnap = await getDocs(qProdutos);
            const produtosList = produtosSnap.docs.map(doc => {
                const data = doc.data() as { nome: string; quantidade_estoque: number };
                return { id: doc.id, nome: data.nome, quantidade_estoque: data.quantidade_estoque };
            });

            const dataToExport = produtosList.map(item => ({
                ID_PRODUTO: item.id,
                PRODUTO: item.nome,
                ESTOQUE_SISTEMA: item.quantidade_estoque || 0,
                CONTAGEM: ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            if (format === 'xlsx') {
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
                XLSX.writeFile(workbook, `inventario_estoque.xlsx`);
            } else {
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `inventario_estoque.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            alert('Erro ao exportar a planilha de estoque.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            Papa.parse(e.target.files[0], {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const inventario = results.data.map((row: any) => ({
                        id: row.ID_PRODUTO,
                        contagem: parseInt(row.CONTAGEM) || 0
                    })).filter(item => item.id);
                    if (inventario.length > 0) processarPlanilha(inventario);
                }
            });
        }
    };

    const processarPlanilha = async (inventario: { id: string, contagem: number }[]) => {
        setLoading(true);
        try {
            const functions = getFunctions();
            const processarInventario = httpsCallable(functions, 'processarInventario');
            const response: any = await processarInventario({ inventario });
            setResultado(response.data);
            setIsModalOpen(true);
        } catch (error) {
            alert('Erro ao processar o arquivo de inventário.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarAjuste = async () => {
        setLoading(true);
        try {
            const functions = getFunctions();
            const confirmarAjuste = httpsCallable(functions, 'confirmarAjusteInventario');
            await confirmarAjuste({ ajustes: resultado });
            alert('Estoque ajustado com sucesso!');
            setIsModalOpen(false);
            setResultado([]);
        } catch (error) {
            alert('Erro ao confirmar o ajuste de estoque.');
        } finally {
            setLoading(false);
        }
    };

    const handleCorrigirEstoque = async () => {
        const perdas = resultado.filter(item => item.diferenca < 0);
        if (perdas.length === 0) {
            alert("Não há perdas de estoque para corrigir.");
            return;
        }
        setLoading(true);
        try {
            const functions = getFunctions();
            const corrigirEstoque = httpsCallable(functions, 'corrigirEstoqueInventario');
            await corrigirEstoque({ perdas });
            alert('Perdas de estoque corrigidas com sucesso!');
            setIsModalOpen(false);
            setResultado([]);
        } catch (error) {
            alert('Erro ao corrigir as perdas de estoque.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Fechamento de Estoque (Inventário)</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-lg p-8 space-y-6 border border-borda">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Exporte a sua lista de produtos</h2>
                    <p className="text-texto-secundario mb-4">Baixe a planilha com o seu estoque atual. Preencha a coluna "CONTAGEM" com a quantidade física de cada item.</p>
                    <div className="flex gap-4">
                        <Button onClick={() => handleExport('xlsx')} disabled={loading} className="w-auto">Download XLSX</Button>
                        <Button onClick={() => handleExport('csv')} disabled={loading} className="w-auto">Download CSV</Button>
                    </div>
                </div>
                <hr className="border-borda" />
                <div>
                    <h2 className="text-xl font-semibold mb-2">2. Importe a planilha preenchida</h2>
                    <p className="text-texto-secundario mb-4">Após preencher, guarde o ficheiro e faça o upload aqui para análise.</p>
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} className="w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primaria-padrao file:text-white hover:file:bg-primaria-escuro" />
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Análise do Inventário" maxWidthClass="max-w-4xl">
                <p className="text-texto-secundario mb-4">Confira as diferenças e escolha uma ação para finalizar o inventário.</p>
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-fundo-principal sticky top-0">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Produto</th>
                                <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Estoque Sistema</th>
                                <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Sua Contagem</th>
                                <th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Diferença</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-borda">
                            {resultado.map(item => (
                                <tr key={item.id} className={`${item.diferenca !== 0 ? 'bg-yellow-100/10' : ''}`}>
                                    <td className="p-3 font-semibold text-texto-principal">{item.nome}</td>
                                    <td className="p-3 text-texto-secundario">{item.quantidade_sistema}</td>
                                    <td className="p-3 text-texto-secundario">{item.contagem}</td>
                                    <td className={`p-3 font-bold ${item.diferenca > 0 ? 'text-green-500' : item.diferenca < 0 ? 'text-red-500' : 'text-texto-secundario'}`}>{item.diferenca}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda">
                    <Button onClick={handleCorrigirEstoque} disabled={loading} className="w-auto !bg-yellow-500 hover:!bg-yellow-600 text-white">
                        Corrigir Perdas
                    </Button>
                    <Button onClick={handleConfirmarAjuste} disabled={loading} className="w-auto !bg-green-600 hover:!bg-green-700 text-white">
                        Fechar Estoque
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">
                        Cancelar
                    </Button>
                </div>
            </Modal>
        </div>
    );
}