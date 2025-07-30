import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFilePdf, FaFileCode } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const PdfIcon = FaFilePdf as React.ElementType;
const CodeIcon = FaFileCode as React.ElementType;

interface NotaFiscal {
    id: string;
    agendamento_id: string;
    status: string;
    numero_nota: string | null;
    chave_acesso: string | null;
    caminho_pdf: string | null;
    caminho_xml: string | null;
    mensagem_erro: string | null;
    criado_em: { toDate: () => Date };
    cliente_nome: string;
}

const statusStyle = (status: string) => {
    switch (status.toLowerCase()) {
        case 'emitido': case 'autorizado': return 'bg-green-100 text-green-800';
        case 'processando': return 'bg-yellow-100 text-yellow-800';
        case 'erro': return 'bg-red-100 text-red-800';
        case 'cancelado': return 'bg-gray-200 text-gray-700';
        default: return 'bg-blue-100 text-blue-800';
    }
};

export default function NotasFiscaisPage() {
    const { user } = useAuth();
    const [notas, setNotas] = useState<NotaFiscal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNotas = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const notasRef = collection(db, 'notas_fiscais');
                const q = query(notasRef, where("empresa_id", "==", user.uid));
                const snap = await getDocs(q);
                setNotas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotaFiscal)));
            } catch (err) {
                setError('Não foi possível carregar as notas fiscais.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotas();
    }, [user]);

    if (loading) return <p className="text-center text-texto-secundario">A carregar notas fiscais...</p>;
    if (error) return <p className="text-center text-erro">{error}</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Notas Fiscais Emitidas</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-borda bg-fundo-principal">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">OS #</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Cliente</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Nº Nota</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data Emissão</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-borda">
                            {notas.length === 0 ? (
                                <tr><td colSpan={6} className="text-center p-8 text-texto-secundario">Nenhuma nota fiscal foi emitida ainda.</td></tr>
                            ) : (
                                notas.map(nota => (
                                    <tr key={nota.id} className="hover:bg-fundo-principal">
                                        <td className="p-4 font-medium text-primaria-padrao">
                                            <Link to={`/ordem-de-servico/${nota.agendamento_id}`} className="hover:underline">
                                                #{String(nota.agendamento_id).substring(0, 6)}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-texto-principal">{nota.cliente_nome}</td>
                                        <td className="p-4 text-texto-secundario">{nota.numero_nota || '---'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle(nota.status)}`}>
                                                {nota.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-texto-secundario">{nota.criado_em.toDate().toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-4">
                                                {nota.caminho_pdf ? (
                                                    <a href={nota.caminho_pdf} target="_blank" rel="noopener noreferrer" title="Baixar PDF" className="text-red-600 hover:text-red-800">
                                                        <PdfIcon size={20} />
                                                    </a>
                                                ) : <PdfIcon size={20} className="text-gray-400" title="PDF indisponível" />}

                                                {nota.caminho_xml ? (
                                                    <a href={nota.caminho_xml} target="_blank" rel="noopener noreferrer" title="Baixar XML" className="text-gray-500 hover:text-gray-700">
                                                        <CodeIcon size={20} />
                                                    </a>
                                                ) : <CodeIcon size={20} className="text-gray-400" title="XML indisponível" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}