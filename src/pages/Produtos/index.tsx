import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { cestCodes } from '../../data/fiscalData'; // Importa a lista de CEST

// Interfaces
interface Grupo { 
    id: number; 
    nome: string; 
    regra_fiscal_id?: number;
}
interface Fornecedor { 
    id: number; 
    nome_fantasia: string; 
}
interface RegraFiscal { 
    id: number; 
    nome_regra: string; 
    ncm_codigo: string; 
}
interface Produto {
    id: number;
    nome: string;
    status: 'ativo' | 'inativo';
    descricao?: string;
    codigo_barras?: string;
    codigo_interno?: string;
    preco_unitario?: number;
    preco_venda?: number;
    ncm?: string;
    cest?: string;
    origem?: string;
    estoque_minimo: number;
    estoque_maximo?: number;
    quantidade_estoque: number;
    unidade_embalagem?: string;
    validade?: string;
    marca?: string;
    peso_liquido?: number;
    peso_bruto?: number;
    altura?: number;
    largura?: number;
    profundidade?: number;
    variantes?: string;
    atributos?: string;
    historico_alteracoes?: string;
    grupo_id?: number;
    regra_fiscal_id?: number;
    fornecedor_id?: number;
    grupo_nome?: string;
    fornecedor_nome?: string;
}

export default function ProdutosPage() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [regrasFiscais, setRegrasFiscais] = useState<RegraFiscal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduto, setCurrentProduto] = useState<Partial<Produto>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [produtosRes, gruposRes, fornecedoresRes, regrasRes] = await Promise.all([
                api.get('/produtos'),
                api.get('/grupos'),
                api.get('/fornecedores'),
                api.get('/regras-fiscais')
            ]);
            setProdutos(produtosRes.data);
            setGrupos(gruposRes.data);
            setFornecedores(fornecedoresRes.data);
            setRegrasFiscais(regrasRes.data);
        } catch (error) {
            alert('Erro ao carregar dados da página. Verifique o console para mais detalhes.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (produto?: Produto) => {
        if (produto) {
            const formattedProduto = {
                ...produto,
                validade: produto.validade ? new Date(produto.validade).toISOString().split('T')[0] : ''
            };
            setCurrentProduto(formattedProduto);
            setIsEditing(true);
        } else {
            setCurrentProduto({ status: 'ativo' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentProduto(prev => ({ ...prev, [name]: value }));
    };

    const handleGrupoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const grupoId = e.target.value;
        const grupoSelecionado = grupos.find(g => g.id === parseInt(grupoId));
        
        setCurrentProduto(prev => {
            const newState: Partial<Produto> = { ...prev, grupo_id: grupoId ? parseInt(grupoId) : undefined };
            if (grupoSelecionado && grupoSelecionado.regra_fiscal_id) {
                const regraAssociada = regrasFiscais.find(r => r.id === grupoSelecionado.regra_fiscal_id);
                if (regraAssociada) {
                    newState.regra_fiscal_id = regraAssociada.id;
                    newState.ncm = regraAssociada.ncm_codigo;
                }
            } else {
                newState.regra_fiscal_id = undefined;
                newState.ncm = '';
            }
            return newState;
        });
    };

    const handleRegraFiscalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const regraId = e.target.value;
        const regraSelecionada = regrasFiscais.find(r => r.id === parseInt(regraId));
        
        setCurrentProduto(prev => ({
            ...prev,
            regra_fiscal_id: regraId ? parseInt(regraId) : undefined,
            ncm: regraSelecionada ? regraSelecionada.ncm_codigo : ''
        }));
    };

    const handleToggleStatus = async (produto: Produto, e: React.MouseEvent) => {
        e.stopPropagation();
        const novoStatus = produto.status === 'ativo' ? 'inativo' : 'ativo';
        if (window.confirm(`Tem a certeza que deseja ${novoStatus === 'ativo' ? 'ativar' : 'desativar'} o produto "${produto.nome}"?`)) {
            try {
                await api.patch(`/produtos/${produto.id}/status`, { status: novoStatus });
                fetchData();
            } catch (error) {
                alert('Erro ao alterar o status do produto.');
            }
        }
    };

    const handleSave = async () => {
        const { id, grupo_nome, fornecedor_nome, ...data } = currentProduto;
        
        const dataToSend = { ...data };
        (Object.keys(dataToSend) as Array<keyof typeof dataToSend>).forEach(key => {
            if (dataToSend[key] === '') {
                (dataToSend as any)[key] = null;
            }
        });

        try {
            if (isEditing) {
                await api.put(`/produtos/${id}`, dataToSend);
            } else {
                await api.post('/produtos', dataToSend);
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

            <div className="bg-fundo-secundario rounded-lg shadow-md border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda">
                        <tr>
                            <th className="p-4 text-texto-secundario">Nome</th>
                            <th className="p-4 text-texto-secundario">Status</th>
                            <th className="p-4 text-texto-secundario">Stock</th>
                            <th className="p-4 text-texto-secundario">Preço de Venda</th>
                            <th className="p-4 text-texto-secundario text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {produtos.map(produto => (
                            <tr key={produto.id} onClick={() => handleOpenModal(produto)} className={`border-b border-borda last:border-b-0 hover:bg-gray-100 cursor-pointer ${produto.quantidade_estoque <= produto.estoque_minimo ? 'bg-red-50' : ''}`}>
                                <td className="p-4 font-semibold text-texto-principal">{produto.nome}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${produto.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                                        {produto.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="p-4 font-semibold">
                                    {produto.quantidade_estoque}
                                    {produto.quantidade_estoque <= produto.estoque_minimo && <span className="ml-2 text-xs text-erro">(Stock Baixo)</span>}
                                </td>
                                <td className="p-4 text-texto-principal font-mono">{Number(produto.preco_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-4 text-center">
                                    <Button 
                                        onClick={(e) => handleToggleStatus(produto, e)} 
                                        variant={produto.status === 'ativo' ? 'danger' : 'primary'}
                                        className="w-auto text-xs py-1 px-2"
                                    >
                                        {produto.status === 'ativo' ? 'Desativar' : 'Ativar'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Produto' : 'Novo Produto'} maxWidthClass="max-w-6xl">
                <div className="space-y-6">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4">
                        <legend className="text-lg font-semibold px-2">Identificação</legend>
                        <Input label="Nome do Produto" name="nome" value={currentProduto.nome || ''} onChange={handleChange} required/>
                        <Input label="Marca" name="marca" value={currentProduto.marca || ''} onChange={handleChange} />
                         <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                            <select name="status" value={currentProduto.status || 'ativo'} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                        <Input label="Código de Barras (EAN)" name="codigo_barras" value={currentProduto.codigo_barras || ''} onChange={handleChange} />
                        <Input label="Código Interno" name="codigo_interno" value={currentProduto.codigo_interno || ''} onChange={handleChange} />
                        <textarea name="descricao" value={currentProduto.descricao || ''} onChange={handleChange} placeholder="Descrição detalhada do produto..." className="w-full px-4 py-3 bg-white border border-borda rounded-lg lg:col-span-4" rows={3}></textarea>
                    </fieldset>
                    
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4">
                        <legend className="text-lg font-semibold px-2">Preços e Stock</legend>
                        <Input label="Preço Unitário (Custo)" name="preco_unitario" type="number" step="0.01" value={currentProduto.preco_unitario || ''} onChange={handleChange} />
                        <Input label="Preço de Venda" name="preco_venda" type="number" step="0.01" value={currentProduto.preco_venda || ''} onChange={handleChange} />
                        <Input label="Quantidade em Stock" name="quantidade_estoque" type="number" value={currentProduto.quantidade_estoque || ''} onChange={handleChange} required />
                        <Input label="Stock Mínimo" name="estoque_minimo" type="number" value={currentProduto.estoque_minimo || ''} onChange={handleChange} required />
                        <Input label="Stock Máximo" name="estoque_maximo" type="number" value={currentProduto.estoque_maximo || ''} onChange={handleChange} />
                        <Input label="Unidade (Ex: un, kg, pç)" name="unidade_embalagem" value={currentProduto.unidade_embalagem || ''} onChange={handleChange} />
                        <Input label="Validade" name="validade" type="date" value={currentProduto.validade || ''} onChange={handleChange} />
                    </fieldset>

                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">
                        <legend className="text-lg font-semibold px-2">Fiscal e Associações</legend>
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Grupo (Opcional)</label>
                            <select name="grupo_id" onChange={handleGrupoChange} value={currentProduto.grupo_id || ''} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Nenhum</option>
                                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Regra Fiscal</label>
                            <select 
                                name="regra_fiscal_id" 
                                onChange={handleRegraFiscalChange} 
                                value={currentProduto.regra_fiscal_id || ''} 
                                className="w-full px-4 py-3 bg-white border border-borda rounded-lg"
                                disabled={!!(grupos.find(g => g.id === currentProduto.grupo_id)?.regra_fiscal_id)}
                            >
                                <option value="">Selecione...</option>
                                {regrasFiscais.map(r => <option key={r.id} value={r.id}>{r.nome_regra}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Fornecedor</label>
                            <select name="fornecedor_id" value={currentProduto.fornecedor_id || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Selecione...</option>
                                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                            </select>
                        </div>
                        <Input label="NCM" name="ncm" value={currentProduto.ncm || ''} readOnly disabled />
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">CEST</label>
                            <select name="cest" value={currentProduto.cest || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Nenhum</option>
                                {cestCodes.map(cest => <option key={cest.codigo} value={cest.codigo}>{cest.codigo} - {cest.descricao}</option>)}
                            </select>
                        </div>
                        <Input label="Origem" name="origem" value={currentProduto.origem || ''} onChange={handleChange} />
                    </fieldset>

                    <fieldset className="grid grid-cols-2 lg:grid-cols-5 gap-4 border-t pt-4">
                        <legend className="text-lg font-semibold px-2">Dimensões e Peso</legend>
                        <Input label="Peso Líquido (kg)" name="peso_liquido" type="number" step="0.001" value={currentProduto.peso_liquido || ''} onChange={handleChange} />
                        <Input label="Peso Bruto (kg)" name="peso_bruto" type="number" step="0.001" value={currentProduto.peso_bruto || ''} onChange={handleChange} />
                        <Input label="Altura (cm)" name="altura" type="number" step="0.01" value={currentProduto.altura || ''} onChange={handleChange} />
                        <Input label="Largura (cm)" name="largura" type="number" step="0.01" value={currentProduto.largura || ''} onChange={handleChange} />
                        <Input label="Profundidade (cm)" name="profundidade" type="number" step="0.01" value={currentProduto.profundidade || ''} onChange={handleChange} />
                    </fieldset>

                     <fieldset className="grid grid-cols-1 gap-4 border-t pt-4">
                        <legend className="text-lg font-semibold px-2">Informações Adicionais</legend>
                        <Input label="Variantes (Ex: Cores, Tamanhos)" name="variantes" value={currentProduto.variantes || ''} onChange={handleChange} />
                        <Input label="Atributos (Ex: Material, Voltagem)" name="atributos" value={currentProduto.atributos || ''} onChange={handleChange} />
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