import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import SignatureCanvas from 'react-signature-canvas';
import CarDiagram from './CarDiagram'; // Alterado para o novo componente
import { Input } from '../../components/Input';

// --- INTERFACES ---
interface Avaria {
    id?: number;
    pos_x: number;
    pos_y: number;
    descricao: string;
    foto_url?: string;
}
interface ItemVerificado {
    id: number;
    nome_item: string;
    estado_checkin: string;
    estado_checkout: string | null;
}
interface ChecklistData {
    id: number;
    data_checkin: string;
    data_checkout: string | null;
    assinatura_cliente_checkin: string;
    assinatura_cliente_checkout: string | null;
    observacoes_checkin: string;
    observacoes_checkout: string | null;
    avarias: Avaria[];
    itens: ItemVerificado[];
}

export default function ChecklistPage() {
    const { agendamentoId } = useParams<{ agendamentoId: string }>();
    const navigate = useNavigate();
    const location = useLocation(); // Hook para ler o estado da navegação

    const [loading, setLoading] = useState(true);
    const [checklist, setChecklist] = useState<ChecklistData | null>(null);
    // O modo é definido pela URL para ser mais explícito
    const [modo, setModo] = useState<'checkin' | 'checkout' | 'view'>('checkin');

    // Estados para os formulários
    const [avarias, setAvarias] = useState<Avaria[]>([]);
    const [itens, setItens] = useState<Partial<ItemVerificado>[]>([
        { nome_item: 'Nível de Combustível', estado_checkin: '' },
        { nome_item: 'Tapetes', estado_checkin: 'OK' },
        { nome_item: 'Rádio/Multimédia', estado_checkin: 'OK' },
        { nome_item: 'Triângulo', estado_checkin: 'OK' },
    ]);
    const [observacoes, setObservacoes] = useState('');
    const sigCanvas = useRef<SignatureCanvas>(null);

    useEffect(() => {
        // Determina o modo baseado no estado passado pelo Link
        const modoInicial = location.state?.modo || 'checkin';

        const fetchChecklist = async () => {
            try {
                const response = await api.get(`/checklist/agendamento/${agendamentoId}`);
                const data = response.data;
                if (data) {
                    setChecklist(data);
                    setAvarias(data.avarias);
                    setItens(data.itens);
                    // Define o modo com base nos dados e no link clicado
                    if (modoInicial === 'checkout' && !data.data_checkout) {
                        setObservacoes(data.observacoes_checkout || '');
                        setModo('checkout');
                    } else {
                        setObservacoes(data.observacoes_checkin || '');
                        setModo('view');
                    }
                } else {
                    setModo('checkin');
                }
            } catch (error) {
                console.error("Erro ao buscar checklist", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChecklist();
    }, [agendamentoId, location.state]);

    const handleDiagramClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (modo !== 'checkin') return;
        const descricao = prompt("Descreva a avaria (ex: Risco, Mossa):");
        if (!descricao) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const posX = ((e.clientX - rect.left) / rect.width) * 100;
        const posY = ((e.clientY - rect.top) / rect.height) * 100;
        setAvarias(prev => [...prev, { pos_x: posX, pos_y: posY, descricao }]);
    };

    const handleItemChange = (index: number, value: string) => {
        const novosItens = [...itens];
        if (modo === 'checkin') {
            novosItens[index].estado_checkin = value;
        } else if (modo === 'checkout') {
            novosItens[index].estado_checkout = value;
        }
        setItens(novosItens);
    };

    const handleSave = async () => {
        if (sigCanvas.current?.isEmpty()) {
            alert("A assinatura do cliente é obrigatória.");
            return;
        }
        setLoading(true);
        const assinatura = sigCanvas.current?.toDataURL('image/png');

        if (modo === 'checkin') {
            try {
                const checklistRes = await api.post('/checklist/checkin', {
                    agendamento_id: agendamentoId,
                    itens_verificados: itens,
                    assinatura_cliente_checkin: assinatura,
                    observacoes_checkin: observacoes
                });
                const checklistId = checklistRes.data.id;

                for (const avaria of avarias) {
                    await api.post('/checklist/avaria', { ...avaria, checklist_id: checklistId });
                }
                alert('Check-in realizado com sucesso!');
                navigate(`/ordem-de-servico/${agendamentoId}`);
            } catch (error) { alert('Erro ao guardar o check-in.'); }

        } else if (modo === 'checkout') {
            try {
                await api.post('/checklist/checkout', {
                    checklist_id: checklist?.id,
                    itens_verificados: itens,
                    assinatura_cliente_checkout: assinatura,
                    observacoes_checkout: observacoes
                });
                alert('Check-out realizado com sucesso!');
                navigate(`/ordem-de-servico/${agendamentoId}`);
            } catch (error) { alert('Erro ao guardar o check-out.'); }
        }
        setLoading(false);
    };

    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">
                {modo === 'checkin' && `Check-in do Veículo - OS #${agendamentoId}`}
                {modo === 'checkout' && `Check-out do Veículo - OS #${agendamentoId}`}
                {modo === 'view' && `Relatório de Vistoria - OS #${agendamentoId}`}
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-fundo-secundario p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Diagrama de Avarias</h2>
                    <div className="relative border border-borda rounded-lg">
                        <CarDiagram onClick={modo === 'checkin' ? handleDiagramClick : undefined} />
                        {avarias.map((avaria, index) => (
                            <div key={index} className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style={{ left: `${avaria.pos_x}%`, top: `${avaria.pos_y}%` }}>
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max p-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">{avaria.descricao}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Itens Verificados</h2>
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 items-center gap-4 font-bold text-texto-secundario"><span className="col-span-1">Item</span><span>Check-in</span><span>Check-out</span></div>
                            {itens.map((item, index) => (
                                <div key={item.id || index} className="grid grid-cols-3 items-center gap-4">
                                    <label className="col-span-1">{item.nome_item}</label>
                                    <Input value={item.estado_checkin || ''} onChange={e => modo === 'checkin' && handleItemChange(index, e.target.value)} disabled={modo !== 'checkin'} />
                                    <Input value={item.estado_checkout || ''} onChange={e => modo === 'checkout' && handleItemChange(index, e.target.value)} disabled={modo !== 'checkout'} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Observações Gerais</h2>
                        {modo !== 'checkin' && checklist?.observacoes_checkin && (
                            <div className='mb-4'><p className='text-sm font-bold text-texto-secundario'>Obs. do Check-in:</p><p className="p-2 bg-gray-800 rounded-md">{checklist.observacoes_checkin}</p></div>
                        )}
                        <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={4} className="w-full p-2 border rounded-lg bg-white text-gray-800" disabled={modo === 'view'} placeholder={modo === 'checkout' ? "Adicione observações de check-out aqui..." : "Adicione observações de check-in aqui..."} />
                    </div>
                    {(modo === 'checkin' || modo === 'checkout') && (
                        <div className="bg-fundo-secundario p-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-4">Assinatura do Cliente</h2>
                            <div className="bg-white border border-borda rounded-lg"><SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'w-full h-32' }} /></div>
                            <Button variant="secondary" onClick={() => sigCanvas.current?.clear()} className="w-auto text-xs py-1 px-2 mt-2">Limpar</Button>
                        </div>
                    )}
                    {modo === 'view' && checklist && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-fundo-secundario p-4 rounded-lg"><h3 className="font-bold mb-2">Assinatura Check-in</h3><img src={checklist.assinatura_cliente_checkin} alt="Assinatura Check-in" /></div>
                            <div className="bg-fundo-secundario p-4 rounded-lg"><h3 className="font-bold mb-2">Assinatura Check-out</h3>{checklist.assinatura_cliente_checkout ? <img src={checklist.assinatura_cliente_checkout} alt="Assinatura Check-out" /> : <p>Pendente</p>}</div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                {modo !== 'view' && <Button onClick={handleSave} disabled={loading} className="w-auto text-lg px-8">{loading ? 'A guardar...' : `Confirmar ${modo === 'checkin' ? 'Check-in' : 'Check-out'}`}</Button>}
                {modo === 'view' && <Button onClick={() => navigate(`/ordem-de-servico/${agendamentoId}`)} className="w-auto text-lg px-8">Voltar para a OS</Button>}
            </div>
        </div>
    );
}