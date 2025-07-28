import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

interface Servico { id: number; nome: string; }
interface Regra {
    id: number;
    descricao: string;
    tipo: 'percentual' | 'fixo';
    valor: number;
    aplica_em_servico_id?: number | null;
    servico_nome?: string;
    ativo: boolean;
}

export default function GestaoComissoesPage() {
    const [regras, setRegras] = useState<Regra[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRegra, setCurrentRegra] = useState<Partial<Regra>>({});
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = async () => {
        try {
            const [regrasRes, servicosRes] = await Promise.all([
                api.get('/comissao/regras'),
                api.get('/servicos')
            ]);
            setRegras(regrasRes.data);
            setServicos(servicosRes.data);
        } catch (error) {
            alert('Erro ao carregar dados.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (regra?: Regra) => {
        if (regra) {
            setCurrentRegra(regra);
            setIsEditing(true);
        } else {
            setCurrentRegra({ tipo: 'percentual', ativo: true, aplica_em_servico_id: null });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setCurrentRegra(prev => ({ ...prev, [name]: checked }));
        } else {
             setCurrentRegra(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        const { id, servico_nome, ...data } = currentRegra;
        const dataToSend = {
            ...data,
            aplica_em_servico_id: data.aplica_em_servico_id || null
        };

        try {
            if (isEditing) {
                await api.put(`/comissao/regras/${id}`, dataToSend);
            } else {
                await api.post('/comissao/regras', dataToSend);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar regra de comissão.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Gestão de Comissões</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Regra</Button>
            </div>
            
            <div className="bg-fundo-secundario rounded-lg shadow-md p-4 border border-borda">
                {regras.map(regra => (
                    <div key={regra.id} onClick={() => handleOpenModal(regra)} className="p-3 border-b border-borda last:border-b-0 cursor-pointer hover:bg-gray-100">
                        <p className="font-bold text-texto-principal">{regra.descricao}</p>
                        <p className="text-sm text-texto-secundario">
                            Valor: {regra.tipo === 'percentual' ? `${regra.valor}%` : `R$ ${regra.valor}`} | Aplica-se a: {regra.servico_nome || 'Todos os Serviços'}
                        </p>
                    </div>
                ))}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Regra' : 'Nova Regra'}>
                <div className="space-y-4">
                    <Input label="Descrição da Regra" name="descricao" value={currentRegra.descricao || ''} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Valor" name="valor" type="number" value={currentRegra.valor || ''} onChange={handleChange} />
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">Tipo</label>
                            <select name="tipo" value={currentRegra.tipo} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="percentual">Percentual (%)</option>
                                <option value="fixo">Fixo (R$)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Aplicar a um Serviço Específico (Opcional)</label>
                        <select name="aplica_em_servico_id" value={currentRegra.aplica_em_servico_id || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="">Todos os Serviços (Regra Geral)</option>
                            {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                    </div>
                     <label className="flex items-center space-x-2">
                        <input type="checkbox" name="ativo" checked={currentRegra.ativo} onChange={handleChange} className="h-5 w-5 rounded"/>
                        <span>Regra Ativa</span>
                     </label>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}