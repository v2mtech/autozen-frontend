import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx'; // Importa a biblioteca para exportar planilha

// Interface para os dados do cliente no mailing
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
                const response = await api.get<ClienteMailing[]>('/relatorios/mailing-clientes');
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
            'Nome': cliente.nome,
            'Email': cliente.email,
            'Telefone': cliente.telefone || 'N/A',
            'CPF': cliente.cpf || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Mailing Clientes');

        // Formata as colunas para terem uma largura melhor
        worksheet['!cols'] = [
            { wch: 35 }, // Nome
            { wch: 35 }, // Email
            { wch: 20 }, // Telefone
            { wch: 20 }  // CPF
        ];

        XLSX.writeFile(workbook, `mailing-clientes-${new Date().toLocaleDateString('pt-BR')}.xlsx`);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Mailing de Clientes</h1>
                <Button onClick={handleExportarPlanilha} disabled={clientes.length === 0} className="w-auto">
                    Exportar para Planilha
                </Button>
            </div>
            <p className="text-gray-400 mb-6">Esta é a lista de todos os clientes que já concluíram um serviço em sua loja.</p>

            {loading ? (
                <p className="text-center text-gray-400">Carregando clientes...</p>
            ) : (
                <div className="bg-fundo-secundario rounded-lg overflow-x-auto shadow-lg">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Telefone</th>
                                <th className="p-4 font-semibold">CPF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((cliente, index) => (
                                <tr key={index} className="border-b border-gray-700 last:border-b-0">
                                    <td className="p-4">{cliente.nome}</td>
                                    <td className="p-4">{cliente.email}</td>
                                    <td className="p-4">{cliente.telefone || 'Não informado'}</td>
                                    <td className="p-4">{cliente.cpf || 'Não informado'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}