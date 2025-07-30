import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export default function LoginEmpresaPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // A função de login virá do seu AuthContext, que será refatorado para usar Firebase
  const { loginEmpresaOuFuncionario } = useAuth(); // Assumindo uma nova função no AuthContext

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // O novo AuthContext terá uma única função que tentará logar e depois
      // verificará no Firestore se o UID do utilizador pertence a um 'lojista' ou 'funcionario'.
      await loginEmpresaOuFuncionario(email, senha);
    } catch (err: any) {
      // O AuthContext irá tratar os erros do Firebase e retornar mensagens amigáveis
      setError(err.message || 'Erro ao tentar fazer login. Verifique as suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-auth-card rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-auth-text-dark">Acesso da Loja / Funcionário</h1>
        <p className="text-auth-text-light mt-2">Faça login para gerir o seu negócio.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
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