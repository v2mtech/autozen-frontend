import React from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from './Button';

interface CartProps {
    onFinalizar: () => void;
}

export function Cart({ onFinalizar }: CartProps) {
    const { cartItems, removeServico, totalCarrinho } = useCart();

    if (cartItems.length === 0) {
        return null; // Não mostra nada se o carrinho estiver vazio
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-fundo-secundario p-6 rounded-lg shadow-2xl border border-gray-700 z-50 animate-fade-in-up">
            <h3 className="text-lg font-bold text-white mb-4">Seu Carrinho de Serviços</h3>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 truncate pr-2">{item.nome}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <button onClick={() => removeServico(item.id)} className="text-red-400 hover:text-red-300 font-bold">✖</button>
                        </div>
                    </div>
                ))}
            </div>
            <hr className="border-gray-600 my-4" />
            <div className="space-y-1 text-sm font-semibold">
                <div className="flex justify-between"><span>Duração Total:</span> <span>{totalCarrinho.duracao} min</span></div>
                <div className="flex justify-between"><span>Preço Total:</span> <span>{totalCarrinho.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            </div>
            <div className="mt-6">
                <Button onClick={onFinalizar}>Agendar Serviços</Button>
            </div>
        </div>
    );
}