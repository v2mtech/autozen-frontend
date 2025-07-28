import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { FaCheckCircle, FaTimesCircle, FaPlusCircle } from 'react-icons/fa';

const CheckIcon = FaCheckCircle as React.ElementType;
const TimesIcon = FaTimesCircle as React.ElementType;
const PlusIcon = FaPlusCircle as React.ElementType;

interface Fornecedor { id: number; nome_fantasia: string; }
interface ProdutoAnalise {
    codigo: string;
    nome: string;
    quantidade: number;
    custo: number;
    produto_existente: any; // Pode ser um objeto de produto ou null
}

export default function EntradaNotaPage() {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
    const [xmlFile, setXmlFile] = useState<File | null>(null);
    const [analise, setAnalise] = useState<ProdutoAnalise[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados para o modal de cadastro de novo produto
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoProduto, setNovoProduto] = useState<any>({});

    useEffect(() => {
        api.get('/fornecedores').then(res => setFornecedores(res.data));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setXmlFile(e.target.files[0]);
        }
    };

    const handleAnalisar = async () => {
        if (!xmlFile) {
            alert('Por favor, selecione um ficheiro XML.');
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('xml', xmlFile);

        try {
            const response = await api.post('/compras/importar-xml/analisar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAnalise(response.data);
        } catch (error) {
            alert('Erro ao analisar o ficheiro XML.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCadastroModal = (produto: ProdutoAnalise) => {
        setNovoProduto({
            nome: produto.nome,
            codigo_interno: produto.codigo,
            preco_unitario: produto.custo,
            preco_venda: produto.custo * 2, // Sugestão de preço de venda (markup 100%)
            quantidade_estoque: 0, // Inicia com 0, a importação irá adicionar
            estoque_minimo: 1,
            status: 'ativo'
        });
        setIsModalOpen(true);
    };

    const handleCadastrarProduto = async () => {
        try {
            const response = await api.post('/produtos', novoProduto);
            const produtoCadastrado = response.data;

            // Atualiza a análise para refletir que o produto agora existe
            setAnalise(prev => prev.map(p =>
                p.codigo === produtoCadastrado.codigo_interno
                    ? { ...p, produto_existente: produtoCadastrado }
                    : p
            ));
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao cadastrar o novo produto.');
        }
    };

    const handleFinalizarEntrada = async () => {
        const produtosParaImportar = analise.map(p => ({
            id: p.produto_existente.id,
            quantidade: p.quantidade,
            custo: p.custo
        }));

        setLoading(true);
        try {
            await api.post('/compras/importar-xml/finalizar', {
                produtos: produtosParaImportar,
                fornecedor_id: selectedFornecedor || null
            });
            alert('Entrada de nota fiscal e atualização de estoque concluídas com sucesso!');
            setAnalise([]);
            setXmlFile(null);
        } catch (error) {
            alert('Ocorreu um erro ao finalizar a entrada da nota.');
        } finally {
            setLoading(false);
        }
    };

    const todosProdutosVinculados = analise.length > 0 && analise.every(p => p.produto_existente);

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Entrada de Nota Fiscal (XML)</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-lg p-8 space-y-6">
                {/* Passo 1: Seleção de Fornecedor e Ficheiro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Fornecedor (Opcional)</label>
                        <select value={selectedFornecedor} onChange={e => setSelectedFornecedor(e.target.value)} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="">Selecione um fornecedor...</option>
                            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Ficheiro XML da Nota Fiscal</label>
                        <div className="flex items-center gap-2">
                            <input type="file" accept=".xml,text/xml" onChange={handleFileChange} className="w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primaria-padrao file:text-white hover:file:bg-primaria-escuro" />
                            <Button onClick={handleAnalisar} disabled={!xmlFile || loading} className="w-auto">
                                {loading ? 'A analisar...' : 'Analisar XML'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Passo 2: Tabela de Análise */}
                {analise.length > 0 && (
                    <div className="border-t border-borda pt-6">
                        <h2 className="text-xl font-bold mb-4">Produtos Encontrados na Nota</h2>
                        <table className="w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Produto no XML</th>
                                    <th className="p-2">Cód.</th>
                                    <th className="p-2">Qtd.</th>
                                    <th className="p-2">Custo Unit.</th>
                                    <th className="p-2">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analise.map(p => (
                                    <tr key={p.codigo} className="border-b border-gray-700">
                                        <td className="p-2">
                                            {p.produto_existente ?
                                                <CheckIcon className="text-green-500" title="Produto vinculado" /> :
                                                <TimesIcon className="text-red-500" title="Produto não encontrado" />
                                            }
                                        </td>
                                        <td className="p-2">{p.nome}</td>
                                        <td className="p-2">{p.codigo}</td>
                                        <td className="p-2">{p.quantidade}</td>
                                        <td className="p-2">{Number(p.custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-2">
                                            {!p.produto_existente && (
                                                <Button onClick={() => handleOpenCadastroModal(p)} className="w-auto text-xs py-1 px-2 flex items-center gap-1">
                                                    <PlusIcon /> Cadastrar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end mt-6">
                            <Button onClick={handleFinalizarEntrada} disabled={!todosProdutosVinculados || loading}>
                                {loading ? 'A processar...' : 'Finalizar Entrada no Estoque'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para Cadastrar Novo Produto */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Produto">
                <div className="space-y-4">
                    <Input label="Nome do Produto" value={novoProduto.nome || ''} onChange={e => setNovoProduto({ ...novoProduto, nome: e.target.value })} />
                    <Input label="Código Interno" value={novoProduto.codigo_interno || ''} onChange={e => setNovoProduto({ ...novoProduto, codigo_interno: e.target.value })} />
                    <Input label="Preço de Custo (R$)" type="number" value={novoProduto.preco_unitario || ''} onChange={e => setNovoProduto({ ...novoProduto, preco_unitario: e.target.value })} />
                    <Input label="Preço de Venda (R$)" type="number" value={novoProduto.preco_venda || ''} onChange={e => setNovoProduto({ ...novoProduto, preco_venda: e.target.value })} />
                    <Input label="Estoque Mínimo" type="number" value={novoProduto.estoque_minimo || ''} onChange={e => setNovoProduto({ ...novoProduto, estoque_minimo: e.target.value })} />
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleCadastrarProduto}>Confirmar Cadastro</Button>
                </div>
            </Modal>
        </div>
    );
}