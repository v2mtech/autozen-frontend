import React, { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Link } from 'react-router-dom';
import { FaBrain } from 'react-icons/fa';

const IconBrain = FaBrain as React.ElementType;

interface HistoricoData {
    cliente: {
        id: number;
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
        setSugestaoIA('');
        try {
            const response = await api.get(`/veiculos/historico/${placa}`);
            setHistorico(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Nenhum histórico encontrado para esta placa.');
        } finally {
            setLoading(false);
        }
    };

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
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Histórico Completo por Placa</h1>
            <div className="bg-fundo-secundario rounded-lg shadow-sm p-6 mb-8 border border-borda">
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
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-texto-principal">{historico.cliente.nome}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
                                    <div><p className="font-semibold text-texto-secundario">Veículo</p><p className="text-texto-principal">{`${historico.cliente.veiculo_marca || ''} ${historico.cliente.veiculo_modelo || ''} ${historico.cliente.veiculo_ano || ''}`.trim() || 'Não informado'}</p></div>
                                    <div><p className="font-semibold text-texto-secundario">Placa</p><p className="text-texto-principal">{historico.cliente.veiculo_placa || 'Não informado'}</p></div>
                                    <div><p className="font-semibold text-texto-secundario">Email</p><p className="text-texto-principal">{historico.cliente.email || 'Não informado'}</p></div>
                                    <div><p className="font-semibold text-texto-secundario">Telefone</p><p className="text-texto-principal">{historico.cliente.telefone || 'Não informado'}</p></div>
                                </div>
                            </div>
                            <Button onClick={handleGerarSugestao} disabled={loadingIA} className="w-auto flex items-center gap-2">
                                <IconBrain />
                                {loadingIA ? 'A analisar...' : 'Gerar Sugestão com IA'}
                            </Button>
                        </div>
                    </div>

                    {(loadingIA || sugestaoIA) && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><IconBrain /> Sugestão da IA</h3>
                            {loadingIA ? (
                                <p>A IA está a analisar o histórico deste cliente para criar uma oferta personalizada...</p>
                            ) : (
                                <p className="prose">{sugestaoIA}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-texto-principal">Ordens de Serviço Realizadas</h3>
                        <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                            <table className="w-full text-left">
                                <thead className="bg-fundo-principal border-b border-borda"><tr><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">OS #</th><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data</th><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Itens</th><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th></tr></thead>
                                <tbody className="divide-y divide-borda">
                                    {historico.ordensServico.map(os => (
                                        <tr key={os.id}><td className="p-3 text-primaria-padrao font-medium"><Link to={`/ordem-de-servico/${os.id}`} className="hover:underline">#{String(os.id).padStart(6, '0')}</Link></td><td className="p-3 text-texto-secundario">{new Date(os.data_hora_inicio).toLocaleDateString('pt-BR')}</td><td className="p-3 text-texto-secundario text-xs">{[os.servicos, os.produtos].filter(Boolean).join(', ')}</td><td className="p-3 text-texto-principal capitalize">{os.status}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-texto-principal">Orçamentos Realizados</h3>
                        <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                            <table className="w-full text-left">
                                <thead className="bg-fundo-principal border-b border-borda"><tr><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Orçamento #</th><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data</th><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Valor Total</th><th className="p-3 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th></tr></thead>
                                <tbody className="divide-y divide-borda">
                                    {historico.orcamentos.map(orc => (
                                        <tr key={orc.id}><td className="p-3 text-primaria-padrao font-medium"><Link to={`/orcamento/${orc.id}`} className="hover:underline">#{orc.id}</Link></td><td className="p-3 text-texto-secundario">{new Date(orc.data_orcamento).toLocaleDateString('pt-BR')}</td><td className="p-3 text-texto-principal font-mono">{Number(orc.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="p-3 text-texto-principal capitalize">{orc.status}</td></tr>
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