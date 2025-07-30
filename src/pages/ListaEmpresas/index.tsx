import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Importa a configuração do Firebase

interface Empresa {
  id: string; // ID do Firestore
  nome_fantasia: string;
  endereco_cidade: string;
  endereco_estado: string;
  logo_url?: string;
}

export default function ListaEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const empresasRef = collection(db, 'empresas');
        const querySnapshot = await getDocs(empresasRef);
        const empresasList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Empresa));
        setEmpresas(empresasList);
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
      <h1 className="text-3xl font-bold mb-6 text-texto-principal">Encontre um Estabelecimento</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresas.map(empresa => (
          <Link to={`/empresas/${empresa.id}`} key={empresa.id} className="block bg-fundo-secundario rounded-lg p-6 hover:bg-gray-700 hover:scale-105 transform transition-all shadow-lg">
            <div className="h-32 bg-gray-700 rounded-md mb-4 flex items-center justify-center overflow-hidden">
              {empresa.logo_url ? (
                <img src={empresa.logo_url} alt={`Logo de ${empresa.nome_fantasia}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500">Logo</span>
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