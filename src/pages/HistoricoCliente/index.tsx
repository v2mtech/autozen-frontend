import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Cliente { id: string; nome: string; }
interface HistoricoItem {
    os_numero: string;
    nome_cliente: string;
    data_execucao: { toDate: () => Date };
    nome_funcionario: string | null;
    checklist_id: string | null;
    has_checkin: boolean;
    has_checkout: boolean;
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function HistoricoClientePage() {
    const { user } = useAuth();
    const [historico, setHistorico] = useState<HistoricoItem[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);

    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return getISODate(d);
    });
    const [dataFim, setDataFim] = useState(getISODate(new Date()));
    const [clienteId, setClienteId] = useState('todos');

    useEffect(() => {
        // Busca a lista de clientes para o filtro
        const fetchClientes = async () => {
            if (!user) return;
            const clientesRef = collection(db, 'usuarios');
            // Idealmente, você buscaria apenas clientes que já interagiram com a sua empresa.
            const snap = await getDocs(clientesRef);
            setClientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente)));
        };
        fetchClientes();
    }, [user]);

    const fetchHistorico = useCallback(async () => {
        setLoading(true);
        try {
            const functions = getFunctions();
            const getHistoricoCliente = httpsCallable(functions, 'getHistoricoCliente');
            const response: any = await getHistoricoCliente({
                data_inicio: dataInicio,
                data_fim: dataFim,
                usuario_id: clienteId === 'todos' ? null : clienteId
            });
            setHistorico(response.data);
        } catch (error) {
            alert('Erro ao buscar histórico.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [dataInicio, dataFim, clienteId]);

    useEffect(() => {
        fetchHistorico();
    }, [fetchHistorico]);

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Histórico de Clientes</h1>

            <div className="bg-fundo-secundario p-4 rounded-lg shadow-sm mb-8 border border-borda">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-auto">
                        <Input label="Data de Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                    <div className="w-full md:w-auto">
                        <Input label="Data de Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                    <div className="flex-grow">
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Cliente</label>
                        <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full px-4 py-3 bg-white border border-borda rounded-lg focus:ring-2 focus:ring-primaria-escuro focus:outline-none transition duration-200">
                            <option value="todos">Todos os Clientes</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <Button onClick={fetchHistorico} disabled={loading} className="w-full">
                            {loading ? 'A buscar...' : 'Filtrar'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">OS #</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Cliente</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Data</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Funcionário</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Relatórios</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center p-8 text-texto-secundario">A carregar histórico...</td></tr>
                        ) : historico.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-8 text-texto-secundario">Nenhum registo encontrado para os filtros selecionados.</td></tr>
                        ) : (
                            historico.map(item => (
                                <tr key={item.os_numero} className="hover:bg-fundo-principal">
                                    <td className="p-4 font-medium text-primaria-padrao">
                                        <Link to={`/ordem-de-servico/${item.os_numero}`} className="hover:underline">
                                            #{String(item.os_numero).substring(0, 6)}
                                        </Link>
                                    </td>
                                    <td className="p-4 text-texto-principal">{item.nome_cliente}</td>
                                    <td className="p-4 text-texto-secundario">{item.data_execucao.toDate().toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4 text-texto-secundario">{item.nome_funcionario || 'N/A'}</td>
                                    <td className="p-4 space-x-2">
                                        {item.has_checkin &&
                                            <Link to={`/checklist/${item.os_numero}`} state={{ modo: 'view' }}>
                                                <Button variant="secondary" className="!py-1 !px-3 !text-xs !w-auto">Ver Check-in</Button>
                                            </Link>
                                        }
                                        {item.has_checkout &&
                                            <Link to={`/checklist/${item.os_numero}`} state={{ modo: 'view' }}>
                                                <Button variant="secondary" className="!py-1 !px-3 !text-xs !w-auto">Ver Check-out</Button>
                                            </Link>
                                        }
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}