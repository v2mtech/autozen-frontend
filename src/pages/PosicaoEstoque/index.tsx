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

    if (loading) return <p className="text-center text-texto-secundario">A carregar...</p>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-4xl font-bold text-texto-principal">Relatório de Posição do Estoque</h1>
                <Button onClick={handleExportar} className="w-full md:w-auto">Exportar para Planilha</Button>
            </div>
            <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Cód. Produto</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Grupo</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Descrição do Produto</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Qtd. em Estoque</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {posicao.map((item, index) => (
                            <tr key={index} className="hover:bg-fundo-principal">
                                <td className="p-4 text-texto-secundario">{item.codigo_interno || '-'}</td>
                                <td className="p-4 text-texto-secundario">{item.grupo_nome || 'Sem Grupo'}</td>
                                <td className="p-4 font-medium text-texto-principal">{item.produto_nome}</td>
                                <td className="p-4 font-bold text-texto-principal">{item.quantidade_estoque}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}