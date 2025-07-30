import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Importa a configuração do Firebase

interface Empresa {
  uid: string; // O ID agora é o UID do Firebase
  nome_fantasia: string;
  endereco_cidade: string;
  endereco_estado: string;
  logo_url?: string;
}

export default function HomeUsuarioPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmpresas() {
      setLoading(true);
      setError(null);
      try {
        const empresasCollectionRef = collection(db, 'empresas');
        const querySnapshot = await getDocs(empresasCollectionRef);

        const empresasList = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as Empresa));

        setEmpresas(empresasList);
      } catch (err) {
        console.error("Erro ao buscar empresas do Firestore:", err);
        setError("Não foi possível carregar os estabelecimentos. Tente recarregar a página.");
      } finally {
        setLoading(false);
      }
    }
    fetchEmpresas();
  }, []);

  if (loading) return <p className="text-center text-texto-secundario p-10">A carregar estabelecimentos...</p>;

  if (error) {
    return (
      <div className="bg-red-100 text-erro p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-2">Ocorreu um Erro</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-texto-principal">Encontre um Estabelecimento</h1>
      <p className="text-texto-secundario mb-8">Selecione uma loja para ver os serviços disponíveis e agendar.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresas.length > 0 ? empresas.map(empresa => (
          <Link
            to={`/empresas/${empresa.uid}`} // A rota agora usa o UID
            key={empresa.uid}
            className="block bg-fundo-secundario rounded-lg overflow-hidden border border-borda hover:border-primaria-padrao hover:shadow-lg transform transition-all duration-300"
          >
            <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url} // A URL agora vem diretamente do Firestore/Storage
                  alt={`Logo de ${empresa.nome_fantasia}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">Sem Logo</span>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-lg font-bold text-texto-principal truncate">{empresa.nome_fantasia}</h2>
              <p className="text-texto-secundario text-sm">{empresa.endereco_cidade}, {empresa.endereco_estado}</p>
            </div>
          </Link>
        )) : (
          <p className="text-texto-secundario col-span-full text-center p-10">Nenhuma loja encontrada.</p>
        )}
      </div>
    </div>
  );
}