import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export default function LoginEmpresaPage() {
  const [loginType, setLoginType] = useState<'lojista' | 'funcionario'>('lojista');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  // Novo estado para o ID da empresa, necessário para o login de funcionário
  const [empresaId, setEmpresaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginEmpresa, loginFuncionario } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'lojista') {
        await loginEmpresa({ email, senha });
      } else {
        if (!empresaId) {
          setError('O ID da Loja é obrigatório para o login de funcionário.');
          setLoading(false);
          return;
        }
        await loginFuncionario({ email, senha, empresa_id: empresaId });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-auth-card rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-auth-text-dark">Acesso da Loja</h1>
        <p className="text-auth-text-light mt-2">Faça login para gerir o seu negócio.</p>
      </div>

      {/* Seletor Moderno */}
      <div className="flex bg-gray-200 rounded-lg p-1">
        <button
          onClick={() => setLoginType('lojista')}
          className={`w-1/2 p-2 rounded-md font-semibold transition-all duration-300 ${loginType === 'lojista' ? 'bg-primaria-padrao text-white shadow-md' : 'text-gray-600'}`}
        >
          Sou Lojista
        </button>
        <button
          onClick={() => setLoginType('funcionario')}
          className={`w-1/2 p-2 rounded-md font-semibold transition-all duration-300 ${loginType === 'funcionario' ? 'bg-primaria-padrao text-white shadow-md' : 'text-gray-600'}`}
        >
          Sou Funcionário
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {loginType === 'funcionario' && (
          <Input
            label="ID da Loja"
            type="text"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            required
            placeholder="Peça o ID ao seu gerente"
          />
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'A entrar...' : 'Entrar'}
        </Button>
      </form>
      <p className="text-center text-auth-text-light text-sm">
        Não tem uma conta de lojista?{' '}
        <Link to="/cadastro/empresa" className="font-semibold text-auth-button hover:underline">
          Registe a sua empresa
        </Link>
      </p>
    </div>
  );
}