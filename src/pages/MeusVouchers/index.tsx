import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Voucher {
    id: number;
    percentual_desconto: number;
    empresa_nome: string;
}

export default function MeusVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const response = await api.get('/meus-vouchers');
                setVouchers(response.data as Voucher[]);
            } catch (error) {
                console.error("Erro ao buscar vouchers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVouchers();
    }, []);

    if (loading) return <p className="text-gray-400">Carregando seus vouchers...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white">Meus Vouchers de Cashback</h1>
            {vouchers.length === 0 ? (
                <div className="bg-fundo-secundario rounded-lg p-8 text-center">
                    <p className="text-gray-400">Você ainda não possui vouchers de desconto disponíveis.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vouchers.map(voucher => (
                        <div key={voucher.id} className="bg-fundo-secundario rounded-lg p-6 shadow-lg text-center">
                            <p className="text-primaria-claro text-4xl font-bold">{Number(voucher.percentual_desconto).toFixed(0)}% OFF</p>
                            <p className="text-white mt-2">em seu próximo serviço na</p>
                            <p className="text-lg font-semibold text-white mt-1">{voucher.empresa_nome}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}