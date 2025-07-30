import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface ClienteMailing {
    nome: string;
    email: string;
    telefone: string | null;
    cpf: string | null;
}

export default function MailingPage() {
    const [clientes, setClientes] = useState<ClienteMailing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMailing = async () => {
            setLoading(true);
            try {
                const functions = getFunctions();
                const getMailingClientes = httpsCallable(functions, 'getMailingClientes');
                const response: any = await getMailingClientes();
                setClientes(response.data);
            } catch (error) {
                alert('Não foi possível carregar a lista de clientes.');
            } finally {
                setLoading(false);
            }
        };
        fetchMailing();
    }, []);

    const handleExportarPlanilha = () => {
        if (clientes.length === 0) {
            alert('Não há clientes para exportar.');
            return;
        }
        const dadosFormatados = clientes.map(cliente => ({
            'Nome': cliente.nome, 'Email': cliente.email,
            'Telefone': cliente.telefone || 'N/A', 'CPF': cliente.cpf || 'N/A'
        }));
        const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
        worksheet['!cols'] = [{ wch: 35 }, { wch: 35 }, { wch: 20 }, { wch: 20 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Mailing Clientes');
        XLSX.writeFile(workbook, `mailing-clientes.xlsx`);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-texto-principal">Mailing de Clientes</h1>
                    <p className="text-texto-secundario mt-1">Esta é a lista de todos os clientes que já concluíram um serviço na sua loja.</p>
                </div>
                <Button onClick={handleExportarPlanilha} disabled={clientes.length === 0} className="w-full md:w-auto">
                    Exportar para Planilha
                </Button>
            </div>

            {loading ? (
                <p className="text-center text-texto-secundario">Carregando clientes...</p>
            ) : (
                <div className="bg-fundo-secundario rounded-lg overflow-hidden shadow-sm border border-borda">
                    <table className="w-full text-left">
                        <thead className="border-b border-borda bg-fundo-principal">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Nome</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Email</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Telefone</th>
                                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">CPF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-borda">
                            {clientes.map((cliente, index) => (
                                <tr key={index} className="hover:bg-fundo-principal">
                                    <td className="p-4 text-texto-principal font-medium">{cliente.nome}</td>
                                    <td className="p-4 text-texto-secundario">{cliente.email}</td>
                                    <td className="p-4 text-texto-secundario">{cliente.telefone || 'Não informado'}</td>
                                    <td className="p-4 text-texto-secundario">{cliente.cpf || 'Não informado'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}