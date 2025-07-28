import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function CadastroUsuarioPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', senha: '', confirmarSenha: '',
    tipo_documento: 'CPF', cpf_cnpj: '', cep: '', endereco_rua: '',
    endereco_numero: '', endereco_bairro: '', endereco_cidade: '',
    endereco_estado: '', complemento: '',
    veiculo_marca: '', veiculo_modelo: '', veiculo_ano: '', 
    veiculo_placa: '', veiculo_cor: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  // States para as listas dinâmicas de veículos
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [anos, setAnos] = useState<Ano[]>([]);
  
  // States para os IDs selecionados, que controlam as buscas
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');

  // Busca as marcas de veículos assim que a página carrega
  useEffect(() => {
    api.get('/veiculos/marcas').then(response => {
      setMarcas(response.data);
    }).catch(err => console.error("Falha ao carregar marcas", err));
  }, []);

  // Busca os modelos sempre que uma marca é selecionada
  useEffect(() => {
    if (selectedMarca) {
      setModelos([]);
      setAnos([]);
      setFormData(prev => ({ ...prev, veiculo_modelo: '', veiculo_ano: '' }));
      api.get(`/veiculos/marcas/${selectedMarca}/modelos`).then(response => {
        setModelos(response.data);
      }).catch(err => console.error("Falha ao carregar modelos", err));
    }
  }, [selectedMarca]);

  // Busca os anos sempre que um modelo é selecionado
  useEffect(() => {
    if (selectedMarca && selectedModelo) {
      setAnos([]);
      setFormData(prev => ({ ...prev, veiculo_ano: '' }));
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
      setFormData(prev => ({
        ...prev,
        endereco_rua: logradouro,
        endereco_bairro: bairro,
        endereco_cidade: localidade,
        endereco_estado: uf,
      }));
    } catch (error) {
      alert('CEP não encontrado. Por favor, preencha o endereço manualmente.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Lógica especial para os selects de veículo
    if (name === 'veiculo_marca_select') {
      const marcaSelecionada = marcas.find(m => m.codigo === value);
      setSelectedMarca(value);
      setSelectedModelo(''); // Limpa o modelo ao trocar de marca
      setFormData(prev => ({ ...prev, veiculo_marca: marcaSelecionada?.nome || '' }));
      return;
    }
    
    if (name === 'veiculo_modelo_select') {
      const modeloSelecionado = modelos.find(m => m.codigo.toString() === value);
      setSelectedModelo(value);
      setFormData(prev => ({ ...prev, veiculo_modelo: modeloSelecionado?.nome || '' }));
      return;
    }
    
    // Lógica padrão para os outros campos
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const { confirmarSenha, ...apiData } = formData;
      await api.post('/usuarios', apiData);
      setSuccess('Registo realizado com sucesso! Será redirecionado para o login.');
      setTimeout(() => navigate('/login/usuario'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível realizar o registo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-auth-card rounded-2xl shadow-xl p-8 md:p-12 my-10 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-auth-text-dark text-center mb-8">Crie a sua Conta de Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 border-t border-auth-border pt-6">
          <legend className="text-lg font-semibold text-auth-button px-2 -mb-4">Dados Pessoais</legend>
          <Input label="Nome Completo" name="nome" value={formData.nome} onChange={handleChange} required />
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          <MaskedInput label="Telefone" name="telefone" mask="(00) 00000-0000" placeholder="(11) 99999-9999" value={formData.telefone} onChange={handleChange} />
          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="text-sm font-semibold text-auth-text-dark block mb-2">Tipo</label>
              <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-auth-border rounded-lg">
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
            <div className="w-2/3">
              <MaskedInput 
                label={formData.tipo_documento} 
                name="cpf_cnpj" 
                mask={formData.tipo_documento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                placeholder={formData.tipo_documento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={formData.cpf_cnpj} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          <Input label="Senha" type="password" name="senha" value={formData.senha} onChange={handleChange} required />
          <Input label="Confirmar Senha" type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} required />
        </fieldset>
        
        <fieldset className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5 border-t border-auth-border pt-6">
          <legend className="text-lg font-semibold text-auth-button px-2 -mb-4">Endereço</legend>
          <div className="relative">
            <MaskedInput label="CEP" name="cep" mask="00000-000" placeholder="00000-000" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} />
            {cepLoading && <span className="absolute right-3 top-10 text-xs text-auth-text-light">A procurar...</span>}
          </div>
          <Input label="Rua / Avenida" name="endereco_rua" value={formData.endereco_rua} onChange={handleChange} />
          <Input label="Número" name="endereco_numero" value={formData.endereco_numero} onChange={handleChange} />
          <Input label="Bairro" name="endereco_bairro" value={formData.endereco_bairro} onChange={handleChange} />
          <Input label="Complemento" name="complemento" value={formData.complemento} onChange={handleChange} />
          <Input label="Cidade" name="endereco_cidade" value={formData.endereco_cidade} onChange={handleChange} />
          <Input label="Estado" name="endereco_estado" value={formData.endereco_estado} onChange={handleChange} />
        </fieldset>
        
        <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-5 border-t border-auth-border pt-6">
          <legend className="text-lg font-semibold text-auth-button px-2 -mb-4">Veículo</legend>
          <div>
            <label className="text-sm font-semibold text-auth-text-dark block mb-2">Marca</label>
            <select name="veiculo_marca_select" value={selectedMarca} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-auth-border rounded-lg">
              <option value="">Selecione a Marca</option>
              {marcas.map(marca => <option key={marca.codigo} value={marca.codigo}>{marca.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-auth-text-dark block mb-2">Modelo</label>
            <select name="veiculo_modelo_select" value={selectedModelo} onChange={handleChange} disabled={!selectedMarca || modelos.length === 0} className="w-full px-4 py-3 bg-white border border-auth-border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">Selecione o Modelo</option>
              {modelos.map(modelo => <option key={modelo.codigo} value={modelo.codigo}>{modelo.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-auth-text-dark block mb-2">Ano</label>
            <select name="veiculo_ano" value={formData.veiculo_ano} onChange={handleChange} disabled={!selectedModelo || anos.length === 0} className="w-full px-4 py-3 bg-white border border-auth-border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">Selecione o Ano</option>
              {anos.map(ano => <option key={ano.codigo} value={ano.nome}>{ano.nome}</option>)}
            </select>
          </div>
          <Input label="Placa" name="veiculo_placa" value={formData.veiculo_placa} onChange={handleChange} />
          <Input label="Cor" name="veiculo_cor" value={formData.veiculo_cor} onChange={handleChange} />
        </fieldset>

        {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center pt-2">{success}</p>}
        
        <div className="pt-4 flex flex-col items-center">
          <div className="w-full md:w-1/3">
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'A registar...' : 'Finalizar Registo'}
            </Button>
          </div>
          <p className="text-center text-auth-text-light text-sm mt-6">
            Já possui uma conta?{' '}
            <Link to="/login/usuario" className="font-semibold text-auth-button hover:underline">
                Faça Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};