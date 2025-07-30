import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export default function LoginUsuarioPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUsuario } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUsuario(email, senha);
      // A navegação agora é gerida pelo AuthContext após o login ser verificado
    } catch (err: any) {
      setError('Email ou senha inválidos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-auth-card rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-auth-text-dark">Acesso do Cliente</h1>
        <p className="text-auth-text-light mt-2">Bem-vindo de volta!</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <Input
          label="O seu Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="A sua Senha"
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
        Não tem uma conta?{' '}
        <Link to="/cadastro/usuario" className="font-semibold text-auth-button hover:underline">
          Registe-se
        </Link>
      </p>
    </div>
  );
}