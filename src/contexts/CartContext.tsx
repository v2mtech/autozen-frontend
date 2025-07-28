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

    // --- IN�CIO DA CORRE��O ---
    // Usamos o useCallback para garantir que a fun��o n�o seja recriada a cada renderiza��o,
    // a menos que suas depend�ncias (neste caso, nenhuma) mudem.
    const addServico = useCallback((servico: Servico) => {
        setCartItems(prevItems => {
            if (prevItems.length > 0 && prevItems[0].empresa_id !== servico.empresa_id) {
                alert('Voc� s� pode adicionar servi�os da mesma empresa ao carrinho.');
                return prevItems;
            }
            if (prevItems.find(item => item.id === servico.id)) {
                alert('Este servi�o j� est� no carrinho.');
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
    // --- FIM DA CORRE��O ---

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