import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Empresa {
  id: number;
  nome_fantasia: string;
  endereco_cidade: string;
  endereco_estado: string;
}

export default function ListaEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const response = await api.get<Empresa[]>('/empresas');
        setEmpresas(response.data);
      } catch (error) {
        console.error("Erro ao buscar empresas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEmpresas();
  }, []);

  if (loading) return <p>Carregando estabelecimentos...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Encontre um Estabelecimento</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresas.map(empresa => (
          <Link to={`/empresas/${empresa.id}`} key={empresa.id} className="block bg-fundo-secundario rounded-lg p-6 hover:bg-gray-700 hover:scale-105 transform transition-all shadow-lg">
            <div className="h-32 bg-gray-700 rounded-md mb-4 flex items-center justify-center">
              <span className="text-gray-500">Logo</span>
            </div>
            <h2 className="text-xl font-bold text-white">{empresa.nome_fantasia}</h2>
            <p className="text-gray-400 text-sm">{empresa.endereco_cidade}, {empresa.endereco_estado}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}