import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';

interface PosicaoEstoqueItem {
    codigo_interno: string;
    grupo_nome: string | null;
    produto_nome: string;
    quantidade_estoque: number;
}

export default function PosicaoEstoquePage() {
    const [posicao, setPosicao] = useState<PosicaoEstoqueItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosicao = async () => {
            setLoading(true);
            try {
                const response = await api.get('/relatorios/posicao-estoque');
                setPosicao(response.data);
            } catch (error) {
                alert('Erro ao carregar a posição do estoque.');
            } finally {
                setLoading(false);
            }
        };
        fetchPosicao();
    }, []);

    const handleExportar = () => {
        const worksheet = XLSX.utils.json_to_sheet(posicao);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PosicaoEstoque");
        XLSX.writeFile(workbook, "posicao_de_estoque.xlsx");
    };

    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Relatório de Posição do Estoque</h1>
                <Button onClick={handleExportar} className="w-auto">Exportar para Planilha</Button>
            </div>
            <div className="bg-fundo-secundario rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Cód. Produto</th>
                            <th className="p-4">Grupo</th>
                            <th className="p-4">Descrição do Produto</th>
                            <th className="p-4">Qtd. em Estoque</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posicao.map((item, index) => (
                            <tr key={index} className="border-b border-gray-700">
                                <td className="p-4">{item.codigo_interno || '-'}</td>
                                <td className="p-4">{item.grupo_nome || 'Sem Grupo'}</td>
                                <td className="p-4 font-semibold">{item.produto_nome}</td>
                                <td className="p-4 font-bold">{item.quantidade_estoque}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}