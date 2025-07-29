import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Empresa {
  id: number;
  nome_fantasia: string;
  endereco_cidade: string;
  endereco_estado: string;
  logo_url?: string;
}

export default function HomeUsuarioPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Estado para erros

  useEffect(() => {
    async function fetchEmpresas() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Empresa[]>('/empresas');
        // ✅ CORREÇÃO DE ROBUSTEZ: Garante que a resposta da API é um array
        if (Array.isArray(response.data)) {
          setEmpresas(response.data);
        } else {
          console.warn("A resposta da API para '/empresas' não era um array. A definir como vazio.", response.data);
          setEmpresas([]); // Define um array vazio para evitar o crash
        }
      } catch (err) {
        console.error("Erro ao buscar empresas:", err);
        setError("Não foi possível carregar os estabelecimentos. Tente recarregar a página.");
      } finally {
        setLoading(false);
      }
    }
    fetchEmpresas();
  }, []);

  if (loading) return <p className="text-center text-gray-400 p-10">A carregar estabelecimentos...</p>;

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-300 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-2">Ocorreu um Erro</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">Encontre um Estabelecimento</h1>
      <p className="text-gray-400 mb-8">Selecione uma loja para ver os serviços e agendar.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresas.map(empresa => (
          <Link
            to={`/empresas/${empresa.id}`}
            key={empresa.id}
            className="block bg-fundo-secundario rounded-lg p-6 hover:bg-gray-700 hover:scale-105 transform transition-all shadow-lg"
          >
            <div className="h-32 bg-gray-700 rounded-md mb-4 flex items-center justify-center overflow-hidden">
              {empresa.logo_url ? (
                <img
                  src={`http://localhost:3333${empresa.logo_url}`}
                  alt={`Logo de ${empresa.nome_fantasia}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">Sem Logo</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{empresa.nome_fantasia}</h2>
            <p className="text-gray-400 text-sm">{empresa.endereco_cidade}, {empresa.endereco_estado}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}