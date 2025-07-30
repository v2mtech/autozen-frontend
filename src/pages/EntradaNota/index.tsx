import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { FaCheckCircle, FaTimesCircle, FaPlusCircle } from 'react-icons/fa';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';

const CheckIcon = FaCheckCircle as React.ElementType;
const TimesIcon = FaTimesCircle as React.ElementType;
const PlusIcon = FaPlusCircle as React.ElementType;

interface Fornecedor { id: string; nome_fantasia: string; }
interface ProdutoAnalise {
    codigo: string;
    nome: string;
    quantidade: number;
    custo: number;
    produto_existente: any;
}

export default function EntradaNotaPage() {
    const { user } = useAuth();
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
    const [xmlFile, setXmlFile] = useState<File | null>(null);
    const [analise, setAnalise] = useState<ProdutoAnalise[]>([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoProduto, setNovoProduto] = useState<any>({});

    useEffect(() => {
        const fetchFornecedores = async () => {
            if (!user) return;
            const fornRef = collection(db, 'fornecedores');
            const q = query(fornRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            setFornecedores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fornecedor)));
        };
        fetchFornecedores();
    }, [user]);

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
        // A lógica de ler o ficheiro é complexa e deve ser uma Cloud Function
        alert("Funcionalidade em migração para Cloud Functions. Simulação de análise será executada.");
        setAnalise([
            // Exemplo de retorno da Cloud Function
            { codigo: 'P001', nome: 'PRODUTO EXISTENTE EXEMPLO', quantidade: 10, custo: 50.0, produto_existente: { id: 'xyz123' } },
            { codigo: 'NP-456', nome: 'PRODUTO NOVO EXEMPLO', quantidade: 5, custo: 90.0, produto_existente: null }
        ]);
        setLoading(false);
    };

    const handleOpenCadastroModal = (produto: ProdutoAnalise) => {
        setNovoProduto({
            nome: produto.nome,
            codigo_interno: produto.codigo,
            preco_unitario: produto.custo,
            preco_venda: produto.custo * 2,
            quantidade_estoque: 0,
            estoque_minimo: 1,
            status: 'ativo'
        });
        setIsModalOpen(true);
    };

    const handleCadastrarProduto = async () => {
        if (!user) return;
        try {
            const dataToSave = { ...novoProduto, empresa_id: user.uid };
            const docRef = await addDoc(collection(db, "produtos"), dataToSave);

            setAnalise(prev => prev.map(p =>
                p.codigo === novoProduto.codigo_interno
                    ? { ...p, produto_existente: { id: docRef.id, ...dataToSave } }
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
            const functions = getFunctions();
            const finalizarImportacao = httpsCallable(functions, 'finalizarImportacaoXml');
            await finalizarImportacao({
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
            <div className="bg-fundo-secundario rounded-lg shadow-lg p-8 space-y-6 border border-borda">
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

                {analise.length > 0 && (
                    <div className="border-t border-borda pt-6">
                        <h2 className="text-xl font-bold mb-4">Produtos Encontrados na Nota</h2>
                        <table className="w-full text-left">
                            <thead className="bg-fundo-principal border-b border-borda">
                                <tr>
                                    <th className="p-2 text-sm font-semibold text-texto-secundario uppercase">Status</th>
                                    <th className="p-2 text-sm font-semibold text-texto-secundario uppercase">Produto no XML</th>
                                    <th className="p-2 text-sm font-semibold text-texto-secundario uppercase">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-borda">
                                {analise.map(p => (
                                    <tr key={p.codigo}>
                                        <td className="p-2">
                                            {p.produto_existente ? <CheckIcon className="text-green-500" title="Produto vinculado" /> : <TimesIcon className="text-red-500" title="Produto não encontrado" />}
                                        </td>
                                        <td className="p-2 text-texto-principal">{p.nome}</td>
                                        <td className="p-2">
                                            {!p.produto_existente && (<Button onClick={() => handleOpenCadastroModal(p)} className="w-auto text-xs py-1 px-2 flex items-center gap-1"><PlusIcon /> Cadastrar</Button>)}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Produto">
                <div className="space-y-4">
                    <Input label="Nome do Produto" value={novoProduto.nome || ''} onChange={e => setNovoProduto({ ...novoProduto, nome: e.target.value })} />
                    <Input label="Código Interno" value={novoProduto.codigo_interno || ''} onChange={e => setNovoProduto({ ...novoProduto, codigo_interno: e.target.value })} />
                    <Input label="Preço de Custo (R$)" type="number" value={novoProduto.preco_unitario || ''} onChange={e => setNovoProduto({ ...novoProduto, preco_unitario: e.target.value })} />
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleCadastrarProduto}>Confirmar Cadastro</Button>
                </div>
            </Modal>
        </div>
    );
}