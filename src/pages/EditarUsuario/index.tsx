import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { MaskedInput } from '../../components/MaskedInput';

// Interfaces para os dados da API FIPE
interface Marca {
  codigo: string;
  nome: string;
}
interface Modelo {
  codigo: number;
  nome: string;
}
interface Ano {
  codigo: string;
  nome: string;
}

// Interface para os dados do formulário do utilizador
interface UserFormData {
    id: number;
    nome: string;
    email: string;
    telefone: string | null;
    tipo_documento: string;
    cpf_cnpj: string | null;
    cep: string | null;
    endereco_rua: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_estado: string | null;
    complemento: string | null;
    veiculo_marca: string | null;
    veiculo_modelo: string | null;
    veiculo_ano: string | null;
    veiculo_placa: string | null;
    veiculo_cor: string | null;
    senha?: string;
}

export default function EditarUsuarioPage() {
    const [formData, setFormData] = useState<Partial<UserFormData>>({});
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [cepLoading, setCepLoading] = useState(false);

    // States para as listas dinâmicas de veículos
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [anos, setAnos] = useState<Ano[]>([]);
    
    // States para os IDs selecionados, que controlam as buscas
    const [selectedMarca, setSelectedMarca] = useState('');
    const [selectedModelo, setSelectedModelo] = useState('');

    // Busca os dados iniciais (perfil e marcas de veículos)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileResponse, marcasResponse] = await Promise.all([
                    api.get<UserFormData>('/usuarios/profile'),
                    api.get<Marca[]>('/veiculos/marcas')
                ]);
                
                const profileData = profileResponse.data;
                setFormData({ ...profileData, senha: '' });
                setMarcas(marcasResponse.data);

                // Se o utilizador já tiver uma marca, define o ID correspondente
                if (profileData.veiculo_marca) {
                    const marcaExistente = marcasResponse.data.find(m => m.nome === profileData.veiculo_marca);
                    if (marcaExistente) {
                        setSelectedMarca(marcaExistente.codigo);
                    }
                }
            } catch (err) {
                setFeedback({ type: 'error', message: "Não foi possível carregar os seus dados." });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Busca os modelos sempre que uma marca for selecionada
    useEffect(() => {
        if (selectedMarca) {
            api.get(`/veiculos/marcas/${selectedMarca}/modelos`).then(response => {
                setModelos(response.data);
                // Se o utilizador já tiver um modelo, define o ID correspondente
                if (formData.veiculo_modelo) {
                    const modeloExistente = response.data.find((m: Modelo) => m.nome === formData.veiculo_modelo);
                    if (modeloExistente) {
                        setSelectedModelo(modeloExistente.codigo.toString());
                    }
                }
            }).catch(err => console.error("Falha ao carregar modelos", err));
        }
    }, [selectedMarca, formData.veiculo_modelo]); // Depende do modelo carregado também

    // Busca os anos sempre que um modelo for selecionado
    useEffect(() => {
        if (selectedMarca && selectedModelo) {
            api.get(`/veiculos/marcas/${selectedMarca}/modelos/${selectedModelo}/anos`).then(response => {
                setAnos(response.data);
            }).catch(err => console.error("Falha ao carregar anos", err));
        }
    }, [selectedModelo, selectedMarca]);

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setCepLoading(true);
        try {
            const response = await api.get(`/cep/${cep}`);
            const { logradouro, bairro, localidade, uf } = response.data;
            setFormData(prev => ({ ...prev, endereco_rua: logradouro, endereco_bairro: bairro, endereco_cidade: localidade, endereco_estado: uf }));
        } catch (error) {
            alert('CEP não encontrado. Por favor, preencha o endereço manualmente.');
        } finally {
            setCepLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'veiculo_marca_select') {
            const marcaSelecionada = marcas.find(m => m.codigo === value);
            setSelectedMarca(value);
            // Limpa seleções dependentes
            setSelectedModelo('');
            setAnos([]);
            setModelos([]);
            setFormData(prev => ({ ...prev, veiculo_marca: marcaSelecionada?.nome || '', veiculo_modelo: '', veiculo_ano: '' }));
            return;
        }
        
        if (name === 'veiculo_modelo_select') {
            const modeloSelecionado = modelos.find(m => m.codigo.toString() === value);
            setSelectedModelo(value);
            // Limpa seleção dependente
            setAnos([]);
            setFormData(prev => ({ ...prev, veiculo_modelo: modeloSelecionado?.nome || '', veiculo_ano: '' }));
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', message: '' });

        const { id, ...dataToSubmit } = formData;

        try {
            await api.put('/usuarios/profile', dataToSubmit);
            setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Erro ao atualizar o perfil.' });
        } finally {
            setLoading(false);
        }
    };
    
    if (loading && !formData.id) {
        return <p className="text-center text-gray-400 p-10">A carregar perfil...</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-texto-principal">Editar o Meu Perfil</h1>
            <div className="max-w-5xl mx-auto bg-fundo-secundario p-8 rounded-lg shadow-xl border border-borda">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 border-t border-borda pt-6">
                        <legend className="text-lg font-semibold text-primaria-intermediario px-2 -mb-4">Dados Pessoais</legend>
                        <Input label="Nome Completo" name="nome" value={formData.nome || ''} onChange={handleChange} required />
                        <Input label="Email" type="email" name="email" value={formData.email || ''} onChange={handleChange} required />
                        <MaskedInput label="Telefone" name="telefone" mask="(00) 00000-0000" value={formData.telefone || ''} onChange={handleChange} />
                        <div className="flex gap-2">
                            <div className="w-1/3">
                                <label className="text-sm font-semibold text-texto-secundario block mb-2">Tipo</label>
                                <select name="tipo_documento" value={formData.tipo_documento || 'CPF'} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                    <option value="CPF">CPF</option>
                                    <option value="CNPJ">CNPJ</option>
                                </select>
                            </div>
                            <div className="w-2/3">
                                <MaskedInput 
                                    label={formData.tipo_documento || 'CPF'}
                                    name="cpf_cnpj" 
                                    mask={formData.tipo_documento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                    value={formData.cpf_cnpj || ''} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>
                        <Input label="Nova Senha" type="password" name="senha" value={formData.senha || ''} onChange={handleChange} placeholder="Deixar em branco para não alterar" />
                    </fieldset>
                    
                    <fieldset className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5 border-t border-borda pt-6">
                        <legend className="text-lg font-semibold text-primaria-intermediario px-2 -mb-4">Endereço</legend>
                        <div className="relative">
                            <MaskedInput label="CEP" name="cep" mask="00000-000" value={formData.cep || ''} onChange={handleChange} onBlur={handleCepBlur} />
                            {cepLoading && <span className="absolute right-3 top-10 text-xs">A procurar...</span>}
                        </div>
                        <Input label="Rua / Avenida" name="endereco_rua" value={formData.endereco_rua || ''} onChange={handleChange} className="lg:col-span-2" />
                        <Input label="Número" name="endereco_numero" value={formData.endereco_numero || ''} onChange={handleChange} />
                        <Input label="Bairro" name="endereco_bairro" value={formData.endereco_bairro || ''} onChange={handleChange} />
                        <Input label="Complemento" name="complemento" value={formData.complemento || ''} onChange={handleChange} />
                        <Input label="Cidade" name="endereco_cidade" value={formData.endereco_cidade || ''} onChange={handleChange} />
                        <Input label="Estado" name="endereco_estado" value={formData.endereco_estado || ''} onChange={handleChange} />
                    </fieldset>
                    
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-5 border-t border-borda pt-6">
                        <legend className="text-lg font-semibold text-primaria-intermediario px-2 -mb-4">Veículo</legend>
                        <div>
                          <label className="text-sm font-semibold text-texto-secundario block mb-2">Marca</label>
                          <select name="veiculo_marca_select" value={selectedMarca} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="">Selecione a Marca</option>
                            {marcas.map(marca => <option key={marca.codigo} value={marca.codigo}>{marca.nome}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-texto-secundario block mb-2">Modelo</label>
                          <select name="veiculo_modelo_select" value={selectedModelo} onChange={handleChange} disabled={!selectedMarca || modelos.length === 0} className="w-full px-4 py-3 bg-white border border-borda rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="">Selecione o Modelo</option>
                            {modelos.map(modelo => <option key={modelo.codigo} value={modelo.codigo}>{modelo.nome}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-texto-secundario block mb-2">Ano</label>
                          <select name="veiculo_ano" value={formData.veiculo_ano || ''} onChange={handleChange} disabled={!selectedModelo || anos.length === 0} className="w-full px-4 py-3 bg-white border border-borda rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="">Selecione o Ano</option>
                            {anos.map(ano => <option key={ano.codigo} value={ano.nome}>{ano.nome}</option>)}
                          </select>
                        </div>
                        <Input label="Placa" name="veiculo_placa" value={formData.veiculo_placa || ''} onChange={handleChange} />
                        <Input label="Cor" name="veiculo_cor" value={formData.veiculo_cor || ''} onChange={handleChange} />
                    </fieldset>

                    {feedback.message && (
                        <p className={`text-sm text-center p-2 rounded-md ${feedback.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-erro/20 text-erro'}`}>
                            {feedback.message}
                        </p>
                    )}
                    
                    <div className="pt-4 flex justify-center">
                        <div className="w-full md:w-1/3">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'A guardar...' : 'Guardar Alterações'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}