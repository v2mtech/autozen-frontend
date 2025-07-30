import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Voucher {
    id: string;
    percentual_desconto: number;
    empresa_nome: string;
}

export default function MeusVouchersPage() {
    const { user } = useAuth();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVouchers = async () => {
            if (!user) return;
            try {
                const vouchersRef = collection(db, 'usuarios_vouchers_cashback');
                const q = query(
                    vouchersRef,
                    where("usuario_id", "==", user.uid),
                    where("status", "==", "disponivel")
                );
                const querySnapshot = await getDocs(q);
                const vouchersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
                setVouchers(vouchersList);
            } catch (error) {
                console.error("Erro ao buscar vouchers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVouchers();
    }, [user]);

    if (loading) return <p className="text-texto-secundario">Carregando seus vouchers...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-texto-principal">Meus Vouchers de Cashback</h1>
            <p className="text-texto-secundario mb-8">Estes são os seus descontos disponíveis para usar nos próximos serviços.</p>

            {vouchers.length === 0 ? (
                <div className="bg-fundo-secundario rounded-lg p-8 text-center border border-borda">
                    <p className="text-texto-secundario">Você ainda não possui vouchers de desconto disponíveis.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vouchers.map(voucher => (
                        <div key={voucher.id} className="bg-fundo-secundario rounded-lg p-6 shadow-sm text-center border border-borda">
                            <p className="text-primaria-padrao text-4xl font-bold">{Number(voucher.percentual_desconto).toFixed(0)}% OFF</p>
                            <p className="text-texto-principal mt-2">em seu próximo serviço na</p>
                            <p className="text-lg font-semibold text-texto-principal mt-1">{voucher.empresa_nome}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}