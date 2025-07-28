import React, { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FaQuestionCircle } from 'react-icons/fa';

// --- ÍCONE E COMPONENTE TOOLTIP ---
const QuestionIcon = FaQuestionCircle as React.ElementType;

const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            {text}
        </div>
    </div>
);

interface EstoqueItem { id: number; nome: string; quantidade_atual: number; }
interface ResultadoInventario {
    id: number;
    nome: string;
    quantidade_sistema: number;
    contagem: number;
    diferenca: number;
}

export default function FechamentoEstoquePage() {
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<ResultadoInventario[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleExport = async (format: 'xlsx' | 'csv') => {
        setLoading(true);
        try {
            const response = await api.get<EstoqueItem[]>('/estoque');
            const dataToExport = response.data.map(item => ({
                ID_PRODUTO: item.id,
                PRODUTO: item.nome,
                ESTOQUE_SISTEMA: item.quantidade_atual,
                CONTAGEM: ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            if (format === 'xlsx') {
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
                XLSX.writeFile(workbook, `inventario_estoque_${new Date().toLocaleDateString('pt-BR')}.xlsx`);
            } else {
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `inventario_estoque_${new Date().toLocaleDateString('pt-BR')}.csv`);
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
            const file = e.target.files[0];
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const inventario = results.data.map((row: any) => ({
                        id: parseInt(row.ID_PRODUTO),
                        contagem: parseInt(row.CONTAGEM) || 0
                    })).filter(item => !isNaN(item.id) && item.id > 0); // Filtra linhas inválidas
                    if (inventario.length > 0) {
                        processarPlanilha(inventario);
                    } else {
                        alert("O ficheiro não contém dados válidos ou está mal formatado. Verifique se as colunas 'ID_PRODUTO' e 'CONTAGEM' existem.");
                    }
                }
            });
        }
    };
    
    const processarPlanilha = async (inventario: {id: number, contagem: number}[]) => {
        setLoading(true);
        try {
            const response = await api.post('/fechamento-estoque/processar', inventario);
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
            await api.post('/fechamento-estoque/confirmar', resultado);
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
            await api.post('/fechamento-estoque/corrigir', perdas);
            alert('Perdas de estoque corrigidas com sucesso (lançadas como venda).');
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
            <div className="bg-fundo-secundario rounded-lg shadow-lg p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Exporte a sua lista de produtos</h2>
                    <p className="text-texto-secundario mb-4">Baixe a planilha com o seu estoque atual. Preencha a coluna "CONTAGEM" com a quantidade física de cada item.</p>
                    <div className="flex gap-4">
                        <Button onClick={() => handleExport('xlsx')} disabled={loading} className="w-auto">Download XLSX</Button>
                        <Button onClick={() => handleExport('csv')} disabled={loading} className="w-auto">Download CSV</Button>
                    </div>
                </div>
                <hr className="border-borda"/>
                <div>
                    <h2 className="text-xl font-semibold mb-2">2. Importe a planilha preenchida</h2>
                    <p className="text-texto-secundario mb-4">Após preencher, guarde o ficheiro e faça o upload aqui para análise.</p>
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} className="w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primaria-padrao file:text-white hover:file:bg-primaria-escuro"/>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Análise do Inventário" maxWidthClass="max-w-4xl">
                <p className="text-texto-secundario mb-4">Confira as diferenças e escolha uma ação para finalizar o inventário.</p>
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-2">Produto</th>
                                <th className="p-2">
                                    <Tooltip text="A quantidade é calculada a partir do último fechamento de estoque, somando o valor do último fechamento com os lançamentos que ocorreram após a data do fechamento.">
                                        <span className="flex items-center gap-1">Estoque Sistema <QuestionIcon /></span>
                                    </Tooltip>
                                </th>
                                <th className="p-2">Sua Contagem</th>
                                <th className="p-2">
                                     <Tooltip text="Quando a quantidade informada na planilha for maior que a quantidade em estoque, esta diferença é destinada ao estoque 'RETORNO', não tendo atualização no custo do produto. Em casos em que o estoque do produto esteja negativo, é efetuada uma entrada em estoque da quantidade informada na planilha, com atualização no custo do produto.">
                                        <span className="flex items-center gap-1">Diferença <QuestionIcon /></span>
                                     </Tooltip>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultado.map(item => (
                                <tr key={item.id} className={`border-b border-gray-700 ${item.diferenca !== 0 ? 'bg-yellow-500/10' : ''}`}>
                                    <td className="p-2 font-semibold">{item.nome}</td>
                                    <td className="p-2">{item.quantidade_sistema}</td>
                                    <td className="p-2">{item.contagem}</td>
                                    <td className={`p-2 font-bold ${item.diferenca > 0 ? 'text-green-500' : item.diferenca < 0 ? 'text-red-500' : ''}`}>{item.diferenca}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda">
                    <Button onClick={handleCorrigirEstoque} disabled={loading} className="w-auto bg-yellow-500 hover:bg-yellow-600">
                        Corrigir Estoque
                    </Button>
                    <Button onClick={handleConfirmarAjuste} disabled={loading} className="w-auto bg-green-600 hover:bg-green-700">
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