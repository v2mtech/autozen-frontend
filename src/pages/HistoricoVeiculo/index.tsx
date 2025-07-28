import React, { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Link } from 'react-router-dom';
import { FaBrain } from 'react-icons/fa'; // Importe o ícone

const IconBrain = FaBrain as React.ElementType;

// Interfaces
interface HistoricoData {
    cliente: {
        id: number; // Adicionado o ID do cliente
        nome: string;
        email: string;
        telefone: string;
        veiculo_placa: string;
        veiculo_marca: string;
        veiculo_modelo: string;
        veiculo_ano: string;
    };
    ordensServico: any[];
    orcamentos: any[];
}

export default function HistoricoVeiculoPage() {
    const [placa, setPlaca] = useState('');
    const [historico, setHistorico] = useState<HistoricoData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- NOVOS ESTADOS PARA A SUGESTÃO DA IA ---
    const [sugestaoIA, setSugestaoIA] = useState('');
    const [loadingIA, setLoadingIA] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (placa.length < 7) {
            setError('Por favor, insira uma placa válida.');
            return;
        }
        setLoading(true);
        setError('');
        setHistorico(null);
        setSugestaoIA(''); // Limpa a sugestão anterior
        try {
            const response = await api.get(`/veiculos/historico/${placa}`);
            setHistorico(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Nenhum histórico encontrado para esta placa.');
        } finally {
            setLoading(false);
        }
    };

    // --- NOVA FUNÇÃO PARA GERAR SUGESTÃO ---
    const handleGerarSugestao = async () => {
        if (!historico?.cliente.id) return;

        setLoadingIA(true);
        setSugestaoIA('');
        try {
            const response = await api.post('/inteligencia/gerar-sugestao', {
                usuario_id: historico.cliente.id
            });
            setSugestaoIA(response.data.sugestao);
        } catch (error) {
            alert('Não foi possível gerar uma sugestão neste momento.');
        } finally {
            setLoadingIA(false);
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Histórico Completo por Placa</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-lg p-8 mb-8">
                <form onSubmit={handleSearch} className="flex items-end gap-4">
                    <div className="flex-1">
                        <Input
                            label="Pesquisar por Placa"
                            value={placa}
                            onChange={e => setPlaca(e.target.value.toUpperCase())}
                            placeholder="AAA1B34"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-auto">
                        {loading ? 'A pesquisar...' : 'Pesquisar'}
                    </Button>
                </form>
                {error && <p className="text-erro text-center mt-4">{error}</p>}
            </div>

            {historico && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="bg-fundo-secundario p-6 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">{historico.cliente.nome}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    {/* ... dados do cliente ... */}
                                </div>
                            </div>
                            {/* --- BOTÃO DE SUGESTÃO DA IA --- */}
                            <Button onClick={handleGerarSugestao} disabled={loadingIA} className="w-auto flex items-center gap-2">
                                <IconBrain />
                                {loadingIA ? 'A analisar...' : 'Gerar Sugestão com IA'}
                            </Button>
                        </div>
                    </div>

                    {/* --- PAINEL PARA EXIBIR A SUGESTÃO --- */}
                    {(loadingIA || sugestaoIA) && (
                        <div className="bg-blue-900/20 border border-blue-500/30 text-gray-900 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><IconBrain /> Sugestão da IA</h3>
                            {loadingIA ? (
                                <p>A IA está a analisar o histórico deste cliente para criar uma oferta personalizada...</p>
                            ) : (
                                <p className="prose prose-invert">{sugestaoIA}</p>
                            )}
                        </div>
                    )}

                    {/* ... (Tabela de Ordens de Serviço e Orçamentos) ... */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Ordens de Serviço Realizadas</h3>
                        <div className="bg-fundo-secundario rounded-lg">
                            <table className="w-full text-left">
                                <thead className="bg-gray-700"><tr><th className="p-3">OS #</th><th className="p-3">Data</th><th className="p-3">Itens</th><th className="p-3">Status</th></tr></thead>
                                <tbody>
                                    {historico.ordensServico.map(os => (
                                        <tr key={os.id} className="border-b border-borda">
                                            <td className="p-3"><Link to={`/ordem-de-servico/${os.id}`} className="text-primaria-padrao hover:underline">#{String(os.id).padStart(6, '0')}</Link></td>
                                            <td className="p-3">{new Date(os.data_hora_inicio).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-3 text-xs">{[os.servicos, os.produtos].filter(Boolean).join(', ')}</td>
                                            <td className="p-3 capitalize">{os.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tabela de Orçamentos */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Orçamentos Realizados</h3>
                        <div className="bg-fundo-secundario rounded-lg">
                            <table className="w-full text-left">
                                <thead className="bg-gray-700"><tr><th className="p-3">Orçamento #</th><th className="p-3">Data</th><th className="p-3">Valor Total</th><th className="p-3">Status</th></tr></thead>
                                <tbody>
                                    {historico.orcamentos.map(orc => (
                                        <tr key={orc.id} className="border-b border-borda">
                                            <td className="p-3"><Link to={`/orcamento/${orc.id}`} className="text-primaria-padrao hover:underline">#{orc.id}</Link></td>
                                            <td className="p-3">{new Date(orc.data_orcamento).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-3 font-mono">{Number(orc.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="p-3 capitalize">{orc.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}