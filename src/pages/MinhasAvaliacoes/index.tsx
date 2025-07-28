import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// Interface para os dados da avaliação
interface Avaliacao {
    id: number;
    nota: number;
    comentario: string;
    criado_em: string;
    usuario_nome: string;
}

// Componente auxiliar para as estrelas de avaliação
const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className={`text-xl ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
        ))}
    </div>
);

export default function MinhasAvaliacoesPage() {
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth(); // Hook para obter informações do usuário logado

    useEffect(() => {
        const fetchAvaliacoes = async () => {
            if (!user) return; // Garante que o usuário está carregado

            try {
                // Reutilizamos o endpoint público passando o ID da empresa logada
                const response = await api.get<Avaliacao[]>(`/empresas/${user.id}/avaliacoes`);
                setAvaliacoes(response.data);
            } catch (err) {
                setError('Não foi possível carregar as avaliações.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAvaliacoes();
    }, [user]); // Roda o efeito quando o 'user' for carregado

    const notaMedia = avaliacoes.length > 0
        ? avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length
        : 0;

    if (loading) return <p className="text-center text-gray-400">Carregando avaliações...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Avaliações de Clientes</h1>

            {/* Cartões de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-fundo-secundario p-6 rounded-lg shadow-lg text-center">
                    <p className="text-gray-400 text-sm font-medium">Nota Média</p>
                    <p className="text-3xl font-bold text-gray-400 flex items-center justify-center gap-2">
                        {notaMedia.toFixed(1)} <span className="text-yellow-400 text-2xl">★</span>
                    </p>
                </div>
                <div className="bg-fundo-secundario p-6 rounded-lg shadow-lg text-center">
                    <p className="text-gray-400 text-sm font-medium">Total de Avaliações</p>
                    <p className="text-3xl font-bold text-gray-400">{avaliacoes.length}</p>
                </div>
            </div>

            {/* Lista de Avaliações */}
            <div className="space-y-4">
                {avaliacoes.length > 0 ? avaliacoes.map(review => (
                    <div key={review.id} className="bg-fundo-secundario p-5 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-white">{review.usuario_nome}</p>
                            <StarRating rating={review.nota} />
                        </div>
                        {review.comentario ? (
                            <p className="text-gray-300 italic">"{review.comentario}"</p>
                        ) : (
                            <p className="text-gray-500 italic">O cliente não deixou um comentário.</p>
                        )}
                        <p className="text-right text-xs text-gray-500 mt-3">
                            {new Date(review.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                )) : (
                    <div className="text-center bg-fundo-secundario p-10 rounded-lg">
                        <p className="text-gray-500">Você ainda não recebeu nenhuma avaliação.</p>
                    </div>
                )}
            </div>
        </div>
    );
}