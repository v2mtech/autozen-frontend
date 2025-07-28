import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface Cliente { id: number; nome: string; }
interface HistoricoItem {
    os_numero: number;
    nome_cliente: string;
    data_execucao: string;
    nome_funcionario: string | null;
    checklist_id: number | null;
    has_checkin: boolean;
    has_checkout: boolean;
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function HistoricoClientePage() {
    const [historico, setHistorico] = useState<HistoricoItem[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);

    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));
    const [clienteId, setClienteId] = useState('todos');

    useEffect(() => {
        api.get('/usuarios/list').then(res => setClientes(res.data));
    }, []);

    const fetchHistorico = useCallback(async () => {
        setLoading(true);
        try {
            const params = { data_inicio: dataInicio, data_fim: dataFim, usuario_id: clienteId };
            const response = await api.get('/relatorios/historico-cliente', { params });
            setHistorico(response.data);
        } catch (error) {
            alert('Erro ao buscar histórico.');
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim, clienteId]);

    useEffect(() => {
        fetchHistorico();
    }, [fetchHistorico]);

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Histórico de Clientes</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-fundo-secundario rounded-lg">
                <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2">Cliente</label>
                    <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg">
                        <option value="todos">Todos</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
                <div className="flex items-end"><Button onClick={fetchHistorico} disabled={loading}>{loading ? 'A buscar...' : 'Filtrar'}</Button></div>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700"><tr><th className="p-4">OS #</th><th className="p-4">Cliente</th><th className="p-4">Data</th><th className="p-4">Funcionário</th><th className="p-4">Relatórios</th></tr></thead>
                    <tbody>
                        {historico.map(item => (
                            <tr key={item.os_numero} className="border-b border-gray-700">
                                <td className="p-4"><Link to={`/ordem-de-servico/${item.os_numero}`} className="text-primaria-padrao hover:underline">#{String(item.os_numero).padStart(6, '0')}</Link></td>
                                <td className="p-4">{item.nome_cliente}</td>
                                <td className="p-4">{new Date(item.data_execucao).toLocaleDateString('pt-BR')}</td>
                                <td className="p-4">{item.nome_funcionario || 'N/A'}</td>
                                <td className="p-4 space-x-2">
                                    {item.has_checkin && <Link to={`/checklist/${item.os_numero}`}><Button variant="secondary" className="w-auto text-xs py-1 px-2">Ver Check-in</Button></Link>}
                                    {item.has_checkout && <Link to={`/checklist/${item.os_numero}`}><Button variant="secondary" className="w-auto text-xs py-1 px-2">Ver Check-out</Button></Link>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}