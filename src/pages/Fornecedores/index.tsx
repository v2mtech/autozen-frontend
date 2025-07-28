import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { MaskedInput } from '../../components/MaskedInput';

interface Fornecedor {
    id: number;
    nome_fantasia: string;
    razao_social: string;
    cnpj_cpf: string;
    inscricao_estadual?: string;
    inscricao_municipal?: string;
    cep?: string;
    endereco_rua?: string;
    endereco_numero?: string;
    endereco_bairro?: string;
    complemento?: string;
    endereco_cidade?: string;
    endereco_estado?: string;
    contato_nome?: string;
    contato_email?: string;
    contato_telefone?: string;
    banco?: string;
    agencia?: string;
    conta_corrente?: string;
    formas_pagamento?: string;
    ramo_atividade?: string;
    status: 'ativo' | 'inativo';
    categorias_oferecidas?: string;
    representantes_legais?: string;
    codigo_contabil?: string;
    info_nota_fiscal?: string;
}

export default function FornecedoresPage() {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFornecedor, setCurrentFornecedor] = useState<Partial<Fornecedor>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    // ✅ ESTADO PARA CONTROLAR O LOADING DA CONSULTA DE CNPJ
    const [cnpjLoading, setCnpjLoading] = useState(false);


    const fetchFornecedores = async () => {
        setLoading(true);
        try {
            const response = await api.get('/fornecedores');
            setFornecedores(response.data);
        } catch (error) {
            alert('Erro ao carregar fornecedores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFornecedores();
    }, []);

    // ✅ NOVA FUNÇÃO PARA CONSULTAR O CNPJ E PREENCHER O FORMULÁRIO
    const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cnpj = e.target.value.replace(/\D/g, '');
        if (cnpj.length !== 14) return;

        setCnpjLoading(true);
        try {
            const response = await api.get(`/cnpj/${cnpj}`);
            const { data } = response;
            setCurrentFornecedor(prev => ({
                ...prev,
                razao_social: data.razao_social,
                nome_fantasia: data.nome_fantasia,
                cep: data.cep?.replace(/\D/g, ''),
                endereco_rua: data.logradouro,
                endereco_numero: data.numero,
                complemento: data.complemento,
                endereco_bairro: data.bairro,
                endereco_cidade: data.municipio,
                endereco_estado: data.uf,
                contato_telefone: data.ddd_telefone_1,
                contato_email: data.email?.toLowerCase(),
            }));
        } catch (error: any) {
            alert(error.response?.data?.error || 'CNPJ não encontrado. Por favor, preencha os dados manualmente.');
        } finally {
            setCnpjLoading(false);
        }
    };


    const handleOpenModal = (fornecedor?: Fornecedor) => {
        if (fornecedor) {
            setCurrentFornecedor(fornecedor);
            setIsEditing(true);
        } else {
            setCurrentFornecedor({ status: 'ativo' }); // Padrão
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCurrentFornecedor({ ...currentFornecedor, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const { id, ...data } = currentFornecedor;
        try {
            if (isEditing) {
                await api.put(`/fornecedores/${id}`, data);
            } else {
                await api.post('/fornecedores', data);
            }
            fetchFornecedores();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar fornecedor.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Fornecedores</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Fornecedor</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-md border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda">
                        <tr>
                            <th className="p-4 text-texto-secundario">Nome Fantasia</th>
                            <th className="p-4 text-texto-secundario">CNPJ/CPF</th>
                            <th className="p-4 text-texto-secundario">Telefone</th>
                            <th className="p-4 text-texto-secundario">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fornecedores.map(fornecedor => (
                            <tr key={fornecedor.id} onClick={() => handleOpenModal(fornecedor)} className="border-b border-borda last:border-b-0 hover:bg-gray-100 cursor-pointer">
                                <td className="p-4 font-semibold text-texto-principal">{fornecedor.nome_fantasia}</td>
                                <td className="p-4 text-texto-principal">{fornecedor.cnpj_cpf}</td>
                                <td className="p-4 text-texto-principal">{fornecedor.contato_telefone || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${fornecedor.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {fornecedor.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Identificação */}
                    <Input label="Nome Fantasia" name="nome_fantasia" value={currentFornecedor.nome_fantasia || ''} onChange={handleChange} required />
                    <Input label="Razão Social" name="razao_social" value={currentFornecedor.razao_social || ''} onChange={handleChange} />

                    {/* ✅ CAMPO DE CNPJ COM A NOVA FUNCIONALIDADE E LOADING */}
                    <div className="relative">
                        <MaskedInput label="CNPJ / CPF" name="cnpj_cpf" mask="00.000.000/0000-00" placeholder="00.000.000/0000-00" value={currentFornecedor.cnpj_cpf || ''} onChange={handleChange} onBlur={handleCnpjBlur} required />
                        {cnpjLoading && <span className="absolute right-3 top-10 text-xs text-gray-500">A procurar...</span>}
                    </div>

                    <Input label="Inscrição Estadual" name="inscricao_estadual" value={currentFornecedor.inscricao_estadual || ''} onChange={handleChange} />
                    <Input label="Inscrição Municipal" name="inscricao_municipal" value={currentFornecedor.inscricao_municipal || ''} onChange={handleChange} />

                    {/* Contato */}
                    <Input label="Nome do Contato" name="contato_nome" value={currentFornecedor.contato_nome || ''} onChange={handleChange} />
                    <Input label="Email" type="email" name="contato_email" value={currentFornecedor.contato_email || ''} onChange={handleChange} />
                    <MaskedInput label="Telefone" name="contato_telefone" mask="(00) 00000-0000" placeholder="(11) 99999-9999" value={currentFornecedor.contato_telefone || ''} onChange={handleChange} />

                    {/* Endereço */}
                    <Input label="CEP" name="cep" value={currentFornecedor.cep || ''} onChange={handleChange} />
                    <Input label="Rua" name="endereco_rua" value={currentFornecedor.endereco_rua || ''} onChange={handleChange} />
                    <Input label="Número" name="endereco_numero" value={currentFornecedor.endereco_numero || ''} onChange={handleChange} />
                    <Input label="Complemento" name="complemento" value={currentFornecedor.complemento || ''} onChange={handleChange} />
                    <Input label="Bairro" name="endereco_bairro" value={currentFornecedor.endereco_bairro || ''} onChange={handleChange} />
                    <Input label="Cidade" name="endereco_cidade" value={currentFornecedor.endereco_cidade || ''} onChange={handleChange} />
                    <Input label="Estado" name="endereco_estado" value={currentFornecedor.endereco_estado || ''} onChange={handleChange} />

                    {/* Financeiro */}
                    <Input label="Banco" name="banco" value={currentFornecedor.banco || ''} onChange={handleChange} />
                    <Input label="Agência" name="agencia" value={currentFornecedor.agencia || ''} onChange={handleChange} />
                    <Input label="Conta Corrente" name="conta_corrente" value={currentFornecedor.conta_corrente || ''} onChange={handleChange} />

                    {/* Outros */}
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                        <select name="status" value={currentFornecedor.status || 'ativo'} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}