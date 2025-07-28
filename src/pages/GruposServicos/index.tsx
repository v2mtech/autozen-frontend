import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

interface RegraFiscal {
    id: number;
    nome_regra: string;
}

interface Grupo {
    id: number;
    nome: string;
    regra_fiscal_id?: number;
    nome_regra?: string; // Campo da junção com a tabela de regras
}

export default function GruposServicosPage() {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [regrasFiscais, setRegrasFiscais] = useState<RegraFiscal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGrupo, setCurrentGrupo] = useState<Partial<Grupo>>({});
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = async () => {
        try {
            const [gruposRes, regrasRes] = await Promise.all([
                api.get('/servico-grupos'),
                api.get('/regras-fiscais')
            ]);
            setGrupos(gruposRes.data);
            setRegrasFiscais(regrasRes.data);
        } catch (error) {
            alert('Erro ao carregar dados da página.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (grupo?: Grupo) => {
        if (grupo) {
            setCurrentGrupo(grupo);
            setIsEditing(true);
        } else {
            setCurrentGrupo({});
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Se o valor for uma string vazia, converte para null para a regra fiscal
        const finalValue = name === 'regra_fiscal_id' && value === '' ? null : value;
        setCurrentGrupo(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSave = async () => {
        const { id, nome_regra, ...data } = currentGrupo;
        try {
            if (isEditing) {
                await api.put(`/servico-grupos/${id}`, data);
            } else {
                await api.post('/servico-grupos', data);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar grupo.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Grupos de Serviços</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Grupo</Button>
            </div>
            
            <div className="bg-fundo-secundario rounded-lg shadow-md p-4 border border-borda">
                {grupos.map(grupo => (
                    <div key={grupo.id} onClick={() => handleOpenModal(grupo)} className="p-3 border-b border-borda last:border-b-0 cursor-pointer hover:bg-gray-100">
                        <p className="font-bold text-texto-principal">{grupo.nome}</p>
                        <p className="text-sm text-texto-secundario">Regra Fiscal: {grupo.nome_regra || 'Nenhuma'}</p>
                    </div>
                ))}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Grupo' : 'Novo Grupo'}>
                <div className="space-y-4">
                    <Input label="Nome do Grupo" name="nome" value={currentGrupo.nome || ''} onChange={handleChange} />
                    
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Regra Fiscal (Opcional)</label>
                        <select 
                            name="regra_fiscal_id" 
                            value={currentGrupo.regra_fiscal_id || ''} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 bg-white border border-borda rounded-lg"
                        >
                            <option value="">Nenhuma</option>
                            {regrasFiscais.map(regra => (
                                <option key={regra.id} value={regra.id}>{regra.nome_regra}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}