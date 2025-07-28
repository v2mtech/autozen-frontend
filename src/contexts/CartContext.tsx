import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';

interface Servico {
    id: number;
    nome: string;
    duracao_minutos: number;
    preco: number;
    empresa_id: number;
}

interface CartContextData {
    cartItems: Servico[];
    addServico: (servico: Servico) => void;
    removeServico: (servicoId: number) => void;
    clearCart: () => void;
    totalCarrinho: { preco: number; duracao: number };
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<Servico[]>([]);

    // --- INÍCIO DA CORREÇÃO ---
    // Usamos o useCallback para garantir que a função não seja recriada a cada renderização,
    // a menos que suas dependências (neste caso, nenhuma) mudem.
    const addServico = useCallback((servico: Servico) => {
        setCartItems(prevItems => {
            if (prevItems.length > 0 && prevItems[0].empresa_id !== servico.empresa_id) {
                alert('Você só pode adicionar serviços da mesma empresa ao carrinho.');
                return prevItems;
            }
            if (prevItems.find(item => item.id === servico.id)) {
                alert('Este serviço já está no carrinho.');
                return prevItems;
            }
            return [...prevItems, servico];
        });
    }, []);

    const removeServico = useCallback((servicoId: number) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== servicoId));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);
    // --- FIM DA CORREÇÃO ---

    const totalCarrinho = useMemo(() =>
        cartItems.reduce(
            (acc, item) => {
                acc.preco += Number(item.preco);
                acc.duracao += item.duracao_minutos;
                return acc;
            },
            { preco: 0, duracao: 0 }
        ), [cartItems]);

    return (
        <CartContext.Provider value={{ cartItems, addServico, removeServico, clearCart, totalCarrinho }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}