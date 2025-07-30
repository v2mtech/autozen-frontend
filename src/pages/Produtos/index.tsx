import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Interfaces (adaptadas para Firestore ID)
interface Grupo { id: string; nome: string; regra_fiscal_id?: string; }
interface Fornecedor { id: string; nome_fantasia: string; }
interface RegraFiscal { id: string; nome_regra: string; ncm_codigo: string; }
interface Produto {
    id: string; // ID do Firestore
    nome: string;
    status: 'ativo' | 'inativo';
    descricao?: string;
    preco_venda?: number;
    preco_unitario?: number;
    estoque_minimo: number;
    quantidade_estoque: number; // Este virá da coleção 'estoque'
    // Outros campos...
    grupo_id?: string;
    regra_fiscal_id?: string;
    fornecedor_id?: string;
}

export default function ProdutosPage() {
    const { user } = useAuth();
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [regrasFiscais, setRegrasFiscais] = useState<RegraFiscal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduto, setCurrentProduto] = useState<Partial<Produto>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Busca produtos da empresa logada
            const produtosRef = collection(db, 'produtos');
            const q = query(produtosRef, where("empresa_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const produtosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto));
            setProdutos(produtosList);

            // A lógica para buscar grupos, fornecedores e regras fiscais seria similar
            // Por simplicidade, mantemos como arrays vazios por agora.
            setGrupos([]);
            setFornecedores([]);
            setRegrasFiscais([]);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert('Erro ao carregar dados da página.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleOpenModal = (produto?: Produto) => {
        if (produto) {
            setCurrentProduto(produto);
            setIsEditing(true);
        } else {
            setCurrentProduto({ status: 'ativo', estoque_minimo: 1, quantidade_estoque: 0 });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentProduto(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user || !currentProduto.nome) {
            alert("O nome do produto é obrigatório.");
            return;
        }

        const { id, ...data } = currentProduto;

        const dataToSave = {
            ...data,
            empresa_id: user.uid,
            // Limpa campos vazios para não poluir o Firestore
            grupo_id: data.grupo_id || null,
            fornecedor_id: data.fornecedor_id || null,
            regra_fiscal_id: data.regra_fiscal_id || null,
        };

        try {
            if (isEditing && id) {
                const produtoRef = doc(db, "produtos", id);
                await updateDoc(produtoRef, dataToSave);
            } else {
                const docRef = await addDoc(collection(db, "produtos"), dataToSave);
                // Cria o registo de estoque inicial
                await setDoc(doc(db, "estoque", docRef.id), {
                    empresa_id: user.uid,
                    produto_id: docRef.id,
                    quantidade: currentProduto.quantidade_estoque || 0
                });
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar produto.');
            console.error(error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Produtos</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Produto</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-sm border border-borda overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Nome</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Stock</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Preço de Venda</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {produtos.map(produto => (
                            <tr key={produto.id} onClick={() => handleOpenModal(produto)} className="cursor-pointer hover:bg-fundo-principal">
                                <td className="p-4 font-semibold text-texto-principal">{produto.nome}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${produto.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                                        {produto.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="p-4 font-semibold text-texto-principal">
                                    {produto.quantidade_estoque}
                                    {produto.quantidade_estoque <= produto.estoque_minimo && <span className="ml-2 text-xs text-erro">(Stock Baixo)</span>}
                                </td>
                                <td className="p-4 text-texto-secundario font-mono">{Number(produto.preco_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Produto' : 'Novo Produto'} maxWidthClass="max-w-4xl">
                <div className="space-y-6">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">
                        <legend className="text-lg font-semibold px-2 text-texto-principal">Informações Básicas</legend>
                        <Input label="Nome do Produto" name="nome" value={currentProduto.nome || ''} onChange={handleChange} required className="md:col-span-2" />
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                            <select name="status" value={currentProduto.status || 'ativo'} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                        <Input label="Preço de Custo (R$)" name="preco_unitario" type="number" step="0.01" value={currentProduto.preco_unitario || ''} onChange={handleChange} />
                        <Input label="Preço de Venda (R$)" name="preco_venda" type="number" step="0.01" value={currentProduto.preco_venda || ''} onChange={handleChange} />
                        <Input label="Estoque Mínimo" name="estoque_minimo" type="number" value={currentProduto.estoque_minimo || ''} onChange={handleChange} required />
                    </fieldset>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}