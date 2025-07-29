import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { regimesTributarios } from '../../data/fiscalData';

interface EmpresaProfile {
  id: number;
  nome_empresa: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco_rua_numero: string;
  endereco_cidade: string;
  endereco_estado: string;
  cep: string;
  endereco_bairro: string;
  complemento: string | null;
  cnpj: string;
  nome_responsavel: string;
  tel_responsavel: string;
  logo_url?: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  regime_tributario: string | null;
}

interface UpdateResponse {
  message: string;
  logo_url?: string;
}

const LogoPlaceholder = () => (
  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border border-borda">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

export default function EditarEmpresaPage() {
  const [formData, setFormData] = useState<Partial<EmpresaProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<EmpresaProfile>('/empresas/profile').then(response => {
      setFormData(response.data);
      if (response.data.logo_url) {
        setPreview(`http://localhost:3333${response.data.logo_url}`);
      }
      setLoading(false);
    }).catch(err => {
      setError("Não foi possível carregar os dados da empresa.");
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      const value = (formData as any)[key];
      if (key !== 'logo_url' && value !== null && value !== undefined) {
        data.append(key, value);
      }
    });
    if (logoFile) {
      data.append('logo', logoFile);
    }

    try {
      const response = await api.put<UpdateResponse>('/empresas/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Perfil atualizado com sucesso!');
      if (response.data.logo_url) {
        setPreview(`http://localhost:3333${response.data.logo_url}?t=${new Date().getTime()}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.id) {
    return <p className="text-texto-secundario text-center p-10">A carregar perfil...</p>
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6 text-texto-principal">Editar Perfil da Empresa</h1>
      <form onSubmit={handleSubmit} className="space-y-8 bg-fundo-secundario p-8 rounded-lg shadow-sm border border-borda">

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center gap-4">
          <p className="text-sm font-semibold text-blue-800">ID da sua Loja para login de funcionários:</p>
          <p className="text-lg font-bold font-mono bg-blue-100 text-blue-900 px-3 py-1 rounded">{formData.id}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {preview ? (
            <img src={preview} alt="Logo da empresa" className="w-32 h-32 rounded-full object-cover bg-gray-200 border-2 border-borda" />
          ) : (
            <LogoPlaceholder />
          )}
          <input type="file" name="logo" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button type="button" onClick={() => fileInputRef.current?.click()} variant="secondary">
            Trocar Logo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input label="Nome Fantasia" name="nome_fantasia" value={formData.nome_fantasia || ''} onChange={handleChange} required />
          <Input label="Nome da Empresa (Razão Social)" name="nome_empresa" value={formData.nome_empresa || ''} onChange={handleChange} required />
          <Input label="CNPJ" name="cnpj" value={formData.cnpj || ''} onChange={handleChange} required />
          <Input label="Inscrição Estadual" name="inscricao_estadual" value={formData.inscricao_estadual || ''} onChange={handleChange} />
          <Input label="Inscrição Municipal" name="inscricao_municipal" value={formData.inscricao_municipal || ''} onChange={handleChange} />
          <div>
            <label className="text-sm font-semibold text-texto-secundario block mb-2">Regime Tributário</label>
            <select
              name="regime_tributario"
              value={formData.regime_tributario || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-borda rounded-lg focus:ring-2 focus:ring-primaria-escuro focus:outline-none transition duration-200"
            >
              {regimesTributarios.map(regime => (
                <option key={regime.valor} value={regime.valor}>{regime.nome}</option>
              ))}
            </select>
          </div>
          <Input label="E-mail de Acesso" type="email" name="email" value={formData.email || ''} onChange={handleChange} required />
          <Input label="Telefone Comercial" name="telefone" value={formData.telefone || ''} onChange={handleChange} />
          <Input label="Nome do Responsável" name="nome_responsavel" value={formData.nome_responsavel || ''} onChange={handleChange} />
          <Input label="Telefone do Responsável" name="tel_responsavel" value={formData.tel_responsavel || ''} onChange={handleChange} />
          <Input label="CEP" name="cep" value={formData.cep || ''} onChange={handleChange} />
          <Input label="Rua e Número" name="endereco_rua_numero" value={formData.endereco_rua_numero || ''} onChange={handleChange} className="lg:col-span-2" />
          <Input label="Bairro" name="endereco_bairro" value={formData.endereco_bairro || ''} onChange={handleChange} />
          <Input label="Complemento" name="complemento" value={formData.complemento || ''} onChange={handleChange} />
          <Input label="Cidade" name="endereco_cidade" value={formData.endereco_cidade || ''} onChange={handleChange} />
          <Input label="Estado" name="endereco_estado" value={formData.endereco_estado || ''} onChange={handleChange} />
        </div>

        {error && <p className="text-erro text-center">{error}</p>}
        {success && <p className="text-green-600 text-center">{success}</p>}

        <div className="pt-4">
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}