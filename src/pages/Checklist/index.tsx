import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button';
import SignatureCanvas from 'react-signature-canvas';
import CarDiagram from './CarDiagram';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';

// --- INTERFACES ---
interface Avaria {
    id?: string;
    pos_x: number;
    pos_y: number;
    descricao: string;
    foto_url?: string;
}
interface ItemVerificado {
    id?: string;
    nome_item: string;
    estado_checkin: string;
    estado_checkout: string | null;
}
interface ChecklistData {
    id: string;
    data_checkin: { toDate: () => Date }; // ✅ Campo Corrigido
    data_checkout: { toDate: () => Date } | null; // ✅ Campo Adicionado
    quilometragem: number | null;
    assinatura_cliente_checkin: string;
    assinatura_cliente_checkout: string | null;
    observacoes_checkin: string;
    observacoes_checkout: string | null;
    avarias: Avaria[];
    itens: ItemVerificado[];
}

export default function ChecklistPage() {
    const { agendamentoId } = useParams<{ agendamentoId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [checklist, setChecklist] = useState<ChecklistData | null>(null);
    const [modo, setModo] = useState<'checkin' | 'checkout' | 'view'>('checkin');

    const [quilometragem, setQuilometragem] = useState<string>('');
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
        const modoInicial = location.state?.modo || 'checkin';
        const fetchChecklist = async () => {
            if (!agendamentoId || !user) return;
            try {
                const q = query(collection(db, 'checklist_veiculo'), where("agendamento_id", "==", agendamentoId));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    const data = { id: doc.id, ...doc.data() } as ChecklistData;
                    setChecklist(data);
                    setAvarias(data.avarias || []);
                    setItens(data.itens || []);
                    setQuilometragem(data.quilometragem?.toString() || '');
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
            } catch (error) { console.error("Erro ao buscar checklist", error); }
            finally { setLoading(false); }
        };
        fetchChecklist();
    }, [agendamentoId, user, location.state]);

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
        if (!user || !agendamentoId) return;
        if (modo !== 'view' && sigCanvas.current?.isEmpty()) {
            alert("A assinatura do cliente é obrigatória.");
            return;
        }
        setLoading(true);
        const assinaturaDataUrl = sigCanvas.current?.toDataURL('image/png');

        try {
            if (modo === 'checkin') {
                const sigRef = ref(storage, `checklists/${agendamentoId}/assinatura_checkin.png`);
                await uploadString(sigRef, assinaturaDataUrl!, 'data_url');
                const assinaturaUrl = await getDownloadURL(sigRef);

                await setDoc(doc(db, 'checklist_veiculo', agendamentoId), {
                    agendamento_id: agendamentoId,
                    empresa_id: user.uid,
                    quilometragem: quilometragem ? parseInt(quilometragem) : null,
                    assinatura_cliente_checkin: assinaturaUrl,
                    observacoes_checkin: observacoes,
                    itens: itens,
                    avarias: avarias,
                    data_checkin: new Date(),
                    data_checkout: null,
                    assinatura_cliente_checkout: null,
                    observacoes_checkout: null
                });
                alert('Check-in realizado com sucesso!');
                navigate(`/ordem-de-servico/${agendamentoId}`);
            } else if (modo === 'checkout' && checklist) {
                const sigRef = ref(storage, `checklists/${agendamentoId}/assinatura_checkout.png`);
                await uploadString(sigRef, assinaturaDataUrl!, 'data_url');
                const assinaturaUrl = await getDownloadURL(sigRef);

                const checklistRef = doc(db, 'checklist_veiculo', checklist.id);
                await updateDoc(checklistRef, {
                    data_checkout: new Date(),
                    assinatura_cliente_checkout: assinaturaUrl,
                    observacoes_checkout: observacoes,
                    itens: itens,
                });
                alert('Check-out realizado com sucesso!');
                navigate(`/ordem-de-servico/${agendamentoId}`);
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert(`Erro ao guardar o ${modo}.`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="text-center text-texto-secundario">A carregar...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6 text-texto-principal">
                {modo === 'checkin' && `Check-in do Veículo - OS #${agendamentoId?.substring(0, 6)}`}
                {modo === 'checkout' && `Check-out do Veículo - OS #${agendamentoId?.substring(0, 6)}`}
                {modo === 'view' && `Relatório de Vistoria - OS #${agendamentoId?.substring(0, 6)}`}
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                    <h2 className="text-xl font-bold mb-4 text-texto-principal">Diagrama de Avarias</h2>
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
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                        <h2 className="text-xl font-bold mb-4 text-texto-principal">Itens Verificados</h2>
                        <div className="space-y-3">
                            <Input label="Quilometragem (KM)" type="number" value={quilometragem} onChange={e => setQuilometragem(e.target.value)} disabled={modo !== 'checkin'} />
                            <div className="grid grid-cols-3 items-center gap-4 font-bold text-texto-secundario pt-2"><span className="col-span-1">Item</span><span>Check-in</span><span>Check-out</span></div>
                            {itens.map((item, index) => (
                                <div key={item.id || index} className="grid grid-cols-3 items-center gap-4">
                                    <label className="col-span-1 text-texto-principal">{item.nome_item}</label>
                                    <Input value={item.estado_checkin || ''} onChange={e => handleItemChange(index, e.target.value)} disabled={modo !== 'checkin'} />
                                    <Input value={item.estado_checkout || ''} onChange={e => handleItemChange(index, e.target.value)} disabled={modo !== 'checkout'} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                        <h2 className="text-xl font-bold mb-4 text-texto-principal">Observações Gerais</h2>
                        {modo !== 'checkin' && checklist?.observacoes_checkin && (
                            <div className='mb-4'><p className='text-sm font-bold text-texto-secundario'>Obs. do Check-in:</p><p className="p-2 bg-fundo-principal rounded-md text-texto-secundario">{checklist.observacoes_checkin}</p></div>
                        )}
                        <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={4} className="w-full p-2 border rounded-lg bg-white text-texto-principal" disabled={modo === 'view'} placeholder={modo === 'checkout' ? "Adicione observações de check-out aqui..." : "Adicione observações de check-in aqui..."} />
                    </div>
                    {(modo === 'checkin' || modo === 'checkout') && (
                        <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda">
                            <h2 className="text-xl font-bold mb-4 text-texto-principal">Assinatura do Cliente</h2>
                            <div className="bg-white border border-borda rounded-lg"><SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'w-full h-32' }} /></div>
                            <Button variant="secondary" onClick={() => sigCanvas.current?.clear()} className="w-auto !text-xs !py-1 !px-2 mt-2">Limpar</Button>
                        </div>
                    )}
                    {modo === 'view' && checklist && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-fundo-secundario p-4 rounded-lg border border-borda"><h3 className="font-bold mb-2 text-texto-principal">Assinatura Check-in</h3><img src={checklist.assinatura_cliente_checkin} alt="Assinatura Check-in" /></div>
                            <div className="bg-fundo-secundario p-4 rounded-lg border border-borda"><h3 className="font-bold mb-2 text-texto-principal">Assinatura Check-out</h3>{checklist.assinatura_cliente_checkout ? <img src={checklist.assinatura_cliente_checkout} alt="Assinatura Check-out" /> : <p className="text-texto-secundario">Pendente</p>}</div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
                <Button onClick={() => navigate(`/ordem-de-servico/${agendamentoId}`)} variant="secondary" className="w-auto text-lg px-8">Voltar para a OS</Button>
                {modo !== 'view' && <Button onClick={handleSave} disabled={loading} className="w-auto text-lg px-8">{loading ? 'A guardar...' : `Confirmar ${modo === 'checkin' ? 'Check-in' : 'Check-out'}`}</Button>}
            </div>
        </div>
    );
}