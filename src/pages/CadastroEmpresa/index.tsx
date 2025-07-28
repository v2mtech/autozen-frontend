import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { MaskedInput } from '../../components/MaskedInput';
import { regimesTributarios } from '../../data/fiscalData';


interface IFormData {
  nome_empresa: string; 
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco_rua_numero: string;
  endereco_cidade: string;
  endereco_estado: string;
  cep: string;
  endereco_bairro: string;
  complemento: string;
  senha: string;
  confirmarSenha: string;
  cnpj: string;
  nome_responsavel: string;
  tel_responsavel: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  regime_tributario: string;
  logo?: File;
}

export default function CadastroEmpresaPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<IFormData>>({ regime_tributario: 'simples_nacional' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      return;
    }

    setCepLoading(true);
    try {
      const response = await api.get(`/cep/${cep}`);
      const { logradouro, bairro, localidade, uf } = response.data;
      setFormData(prev => ({
        ...prev,
        endereco_rua_numero: logradouro,
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

  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cnpj = e.target.value.replace(/\D/g, '');
    if (cnpj.length !== 14) return;

    setCnpjLoading(true);
    setError('');
    try {
        const response = await api.get(`/cnpj/${cnpj}`);
        const { data } = response;
        setFormData(prev => ({
            ...prev,
            nome_empresa: data.razao_social,
            nome_fantasia: data.nome_fantasia,
            cep: data.cep,
            endereco_rua_numero: `${data.logradouro}, ${data.numero}`,
            complemento: data.complemento,
            endereco_bairro: data.bairro,
            endereco_cidade: data.municipio,
            endereco_estado: data.uf,
            telefone: data.ddd_telefone_1,
            email: data.email,
        }));
    } catch (error: any) {
        setError(error.response?.data?.error || 'CNPJ não encontrado. Por favor, preencha os dados manualmente.');
    } finally {
        setCnpjLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      const postData = new FormData();
      Object.keys(formData).forEach(key => {
        const value = (formData as any)[key];
        if (value) {
            postData.append(key, value);
        }
      });
      
      await api.post('/empresas', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Empresa cadastrada com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login/empresa');
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível cadastrar a empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-auth-card rounded-2xl shadow-xl p-8 md:p-12 my-10 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-auth-text-dark">Crie sua Conta Empresarial</h1>
        <p className="text-auth-text-light mt-2">Gerencie seus serviços e agendamentos com facilidade.</p>
      </div>

      <div className="flex justify-center items-center mb-8">
          <input
              type="file"
              name="logo"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
          />
          <div
              className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-auth-border flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 hover:border-auth-button transition-colors"
              onClick={() => fileInputRef.current?.click()}
          >
              {preview ? (
                  <img src={preview} alt="Preview do Logo" className="w-full h-full rounded-full object-cover"/>
              ) : (
                  <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="text-gray-400 text-xs mt-1">Logo</span>
                  </>
              )}
          </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <div className="relative">
                <MaskedInput label="CNPJ" name="cnpj" mask="00.000.000/0000-00" value={formData.cnpj || ''} onBlur={handleCnpjBlur} onChange={handleChange} required />
                {cnpjLoading && <span className="absolute right-3 top-10 text-xs text-auth-text-light">A procurar...</span>}
            </div>
            <Input label="Nome da Empresa (Razão Social)" name="nome_empresa" value={formData.nome_empresa || ''} onChange={handleChange} required />
            <Input label="Nome Fantasia" name="nome_fantasia" value={formData.nome_fantasia || ''} onChange={handleChange} required />
            <Input label="Inscrição Estadual" name="inscricao_estadual" value={formData.inscricao_estadual || ''} onChange={handleChange} />
            <Input label="Inscrição Municipal (Opcional)" name="inscricao_municipal" value={formData.inscricao_municipal || ''} onChange={handleChange} />
            <div>
                <label className="text-sm font-semibold text-auth-text-dark block mb-2">Regime Tributário</label>
                <select name="regime_tributario" value={formData.regime_tributario} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-auth-border rounded-lg">
                    {regimesTributarios.map(regime => (
                        <option key={regime.valor} value={regime.valor}>{regime.nome}</option>
                    ))}
                </select>
            </div>
            <Input label="E-mail de Acesso" type="email" name="email" value={formData.email || ''} onChange={handleChange} required />
            <Input label="Senha (mín. 6 caracteres)" type="password" name="senha" onChange={handleChange} required />
            <Input label="Confirmar Senha" type="password" name="confirmarSenha" onChange={handleChange} required />
          </div>
          <div className="space-y-6">
            <div className="relative">
              <MaskedInput label="CEP" name="cep" mask="00000-000" value={formData.cep || ''} onChange={handleChange} onBlur={handleCepBlur} />
              {cepLoading && <span className="absolute right-3 top-10 text-xs text-auth-text-light">A procurar...</span>}
            </div>
            <Input label="Rua e Número" name="endereco_rua_numero" value={formData.endereco_rua_numero || ''} onChange={handleChange} />
            <Input label="Bairro" name="endereco_bairro" value={formData.endereco_bairro || ''} onChange={handleChange} />
            <Input label="Complemento" name="complemento" value={formData.complemento || ''} onChange={handleChange} />
            <Input label="Cidade" name="endereco_cidade" value={formData.endereco_cidade || ''} onChange={handleChange} />
            <Input label="Estado" name="endereco_estado" value={formData.endereco_estado || ''} onChange={handleChange} />
            <MaskedInput label="Telefone Comercial" name="telefone" mask="(00) 00000-0000" value={formData.telefone || ''} onChange={handleChange} />
            <Input label="Nome do Responsável" name="nome_responsavel" value={formData.nome_responsavel || ''} onChange={handleChange} />
            <MaskedInput label="Telefone do Responsável" name="tel_responsavel" mask="(00) 00000-0000" value={formData.tel_responsavel || ''} onChange={handleChange} />
          </div>
        </div>
        <div className="pt-6 flex flex-col items-center">
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center mb-4">{success}</p>}
          <div className="w-full md:w-1/3">
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'A registar...' : 'Finalizar Registo'}
            </Button>
          </div>
          <p className="text-center text-auth-text-light text-sm mt-6">
              Já possui uma conta?{' '}
              <Link to="/login/empresa" className="font-semibold text-auth-button hover:underline">
                  Faça Login
              </Link>
          </p>
        </div>
      </form>
    </div>
  );
};