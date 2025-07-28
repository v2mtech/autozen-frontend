import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaFilePdf, FaFileCode } from 'react-icons/fa';

// --- INÍCIO DA CORREÇÃO ---
// 1. Forçamos a tipagem dos ícones para serem reconhecidos como componentes válidos.
const PdfIcon = FaFilePdf as React.ElementType;
const CodeIcon = FaFileCode as React.ElementType;
// --- FIM DA CORREÇÃO ---

// Interface para os dados da nota fiscal
interface NotaFiscal {
    id: number;
    agendamento_id: number;
    status: string;
    numero_nota: string | null;
    chave_acesso: string | null;
    caminho_pdf: string | null;
    caminho_xml: string | null;
    mensagem_erro: string | null;
    criado_em: string;
    cliente_nome: string;
}

const statusStyle = (status: string) => {
    switch (status.toLowerCase()) {
        case 'emitido':
        case 'autorizado':
            return 'bg-green-500/20 text-green-300';
        case 'processando':
            return 'bg-yellow-500/20 text-yellow-300';
        case 'erro':
            return 'bg-red-500/20 text-red-300';
        case 'cancelado':
            return 'bg-gray-500/20 text-gray-300';
        default:
            return 'bg-blue-500/20 text-blue-300';
    }
};

export default function NotasFiscaisPage() {
    const [notas, setNotas] = useState<NotaFiscal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNotas = async () => {
            setLoading(true);
            try {
                const response = await api.get('/notas-fiscais');
                setNotas(response.data);
            } catch (err) {
                setError('Não foi possível carregar as notas fiscais.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotas();
    }, []);

    if (loading) return <p className="text-center text-gray-400">A carregar notas fiscais...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Notas Fiscais Emitidas</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4 font-semibold">OS #</th>
                                <th className="p-4 font-semibold">Cliente</th>
                                <th className="p-4 font-semibold">Nº Nota</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Data Emissão</th>
                                <th className="p-4 font-semibold text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-500">Nenhuma nota fiscal foi emitida ainda.</td>
                                </tr>
                            ) : (
                                notas.map(nota => (
                                    <tr key={nota.id} className="border-b border-gray-700 last:border-b-0">
                                        <td className="p-4 font-mono">#{String(nota.agendamento_id).padStart(6, '0')}</td>
                                        <td className="p-4">{nota.cliente_nome}</td>
                                        <td className="p-4">{nota.numero_nota || '---'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle(nota.status)}`}>
                                                {nota.status}
                                            </span>
                                        </td>
                                        <td className="p-4">{new Date(nota.criado_em).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-4">
                                                {nota.caminho_pdf ? (
                                                    <a href={nota.caminho_pdf} target="_blank" rel="noopener noreferrer" title="Baixar PDF" className="text-red-400 hover:text-red-300">
                                                        <PdfIcon size={20} />
                                                    </a>
                                                ) : <PdfIcon size={20} className="text-gray-600" title="PDF indisponível" />}
                                                
                                                {nota.caminho_xml ? (
                                                    <a href={nota.caminho_xml} target="_blank" rel="noopener noreferrer" title="Baixar XML" className="text-gray-400 hover:text-gray-200">
                                                        <CodeIcon size={20} />
                                                    </a>
                                                ) : <CodeIcon size={20} className="text-gray-600" title="XML indisponível" />}
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