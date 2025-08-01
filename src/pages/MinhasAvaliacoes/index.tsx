﻿import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Avaliacao {
    id: string;
    nota: number;
    comentario: string;
    criado_em: { toDate: () => Date };
    usuario_nome: string;
}

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className={`text-xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
        ))}
    </div>
);

export default function MinhasAvaliacoesPage() {
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchAvaliacoes = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const avaliacoesRef = collection(db, 'avaliacoes');
                const q = query(avaliacoesRef, where("empresa_id", "==", user.uid));
                const querySnapshot = await getDocs(q);
                const avlsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Avaliacao));
                setAvaliacoes(avlsList);
            } catch (err) {
                setError('Não foi possível carregar as avaliações.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAvaliacoes();
    }, [user]);

    const notaMedia = avaliacoes.length > 0
        ? avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length
        : 0;

    if (loading) return <p className="text-center text-texto-secundario">Carregando avaliações...</p>;
    if (error) return <p className="text-center text-erro">{error}</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Avaliações de Clientes</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda text-center">
                    <p className="text-texto-secundario text-sm font-medium">Nota Média</p>
                    <p className="text-3xl font-bold text-texto-principal flex items-center justify-center gap-2">
                        {notaMedia.toFixed(1)} <span className="text-yellow-400 text-2xl">★</span>
                    </p>
                </div>
                <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda text-center">
                    <p className="text-texto-secundario text-sm font-medium">Total de Avaliações</p>
                    <p className="text-3xl font-bold text-texto-principal">{avaliacoes.length}</p>
                </div>
            </div>

            <div className="space-y-4">
                {avaliacoes.length > 0 ? avaliacoes.map(review => (
                    <div key={review.id} className="bg-fundo-secundario p-5 rounded-lg border border-borda">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <p className="font-bold text-texto-principal">{review.usuario_nome}</p>
                                <StarRating rating={review.nota} />
                            </div>
                            <p className="text-xs text-texto-secundario">
                                {review.criado_em.toDate().toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        {review.comentario ? (
                            <p className="text-texto-secundario italic">"{review.comentario}"</p>
                        ) : (
                            <p className="text-gray-400 italic">O cliente não deixou um comentário.</p>
                        )}
                    </div>
                )) : (
                    <div className="text-center bg-fundo-secundario p-10 rounded-lg">
                        <p className="text-texto-secundario">Você ainda não recebeu nenhuma avaliação.</p>
                    </div>
                )}
            </div>
        </div>
    );
}