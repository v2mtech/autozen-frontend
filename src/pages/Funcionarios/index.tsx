import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

interface HorariosDisponibilidade {
    [dia: string]: string[];
}

const ScheduleEditor = ({ value, onChange }: { value: HorariosDisponibilidade, onChange: (newVal: HorariosDisponibilidade) => void }) => {
    const handleDayToggle = (dia: string) => {
        const isEnabled = value[dia] && value[dia].length > 0;
        const newSchedule = { ...value };
        isEnabled ? newSchedule[dia] = [] : newSchedule[dia] = ['09:00-18:00'];
        onChange(newSchedule);
    };
    const handleTimeChange = (dia: string, index: number, newTime: string) => {
        const newSchedule = { ...value };
        newSchedule[dia][index] = newTime;
        onChange(newSchedule);
    };
    return (
        <div className="space-y-4">
            {DIAS_SEMANA.map(dia => (
                <div key={dia} className="flex items-center gap-4 p-2 rounded-lg bg-gray-700">
                    <input type="checkbox" id={`check-${dia}`} checked={value[dia]?.length > 0} onChange={() => handleDayToggle(dia)} className="h-5 w-5 rounded text-cyan-500" />
                    <label htmlFor={`check-${dia}`} className="capitalize w-20">{dia}</label>
                    {value[dia]?.length > 0 ? <Input type="text" value={value[dia][0] || ''} onChange={e => handleTimeChange(dia, 0, e.target.value)} placeholder="ex: 09:00-18:00" /> : <p className="text-sm text-gray-500">Folga</p>}
                </div>
            ))}
        </div>
    );
};

interface Funcionario {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    horarios_trabalho: HorariosDisponibilidade | null;
    perfil_id: number | null;
}

interface Perfil {
    id: number;
    nome: string;
}

const defaultSchedule: HorariosDisponibilidade = {
    domingo: [], segunda: ['09:00-18:00'], terca: ['09:00-18:00'],
    quarta: ['09:00-18:00'], quinta: ['09:00-18:00'], sexta: ['09:00-18:00'], sabado: [],
};

export default function FuncionariosPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [perfis, setPerfis] = useState<Perfil[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFuncionario, setCurrentFuncionario] = useState<Partial<Funcionario & { senha?: string }>>({});

    const fetchData = async () => {
        try {
            const [funcRes, perfisRes] = await Promise.all([
                api.get<Funcionario[]>('/funcionarios'),
                api.get<Perfil[]>('/perfis-funcionarios')
            ]);
            setFuncionarios(funcRes.data);
            setPerfis(perfisRes.data);
        } catch (error) {
            alert('Erro ao buscar dados.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (func?: Funcionario) => {
        if (func) {
            setIsEditing(true);
            setCurrentFuncionario({ ...func, horarios_trabalho: func.horarios_trabalho || defaultSchedule });
        } else {
            setIsEditing(false);
            setCurrentFuncionario({ horarios_trabalho: defaultSchedule });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveFuncionario = async () => {
        const { id, ...data } = currentFuncionario;
        if (!isEditing && !data.senha) {
            alert("A senha é obrigatória para criar um novo funcionário.");
            return;
        }
        try {
            if (isEditing) {
                await api.put(`/funcionarios/${id}`, data);
            } else {
                await api.post('/funcionarios', data);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            alert('Erro ao salvar funcionário.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Funcionários</h1>
                <Button onClick={() => handleOpenModal()} variant="primary" className="w-auto">Adicionar Funcionário</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700"><tr><th className="p-4">Nome</th><th className="p-4">Email</th><th className="p-4">Ações</th></tr></thead>
                    <tbody>
                        {funcionarios.map(func => (
                            <tr key={func.id} className="border-b border-gray-700 last:border-b-0">
                                <td className="p-4">{func.nome}</td>
                                <td className="p-4">{func.email || '-'}</td>
                                <td className="p-4"><button onClick={() => handleOpenModal(func)} className="text-yellow-400 hover:text-yellow-300 font-semibold">Editar</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}>
                <div className="space-y-4">
                    <Input label="Nome Completo" value={currentFuncionario.nome || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, nome: e.target.value })} required />
                    <Input label="Email" type="email" value={currentFuncionario.email || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, email: e.target.value })} required />
                    <Input label="Telefone" value={currentFuncionario.telefone || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, telefone: e.target.value })} />
                    <Input label="Senha" type="password" value={currentFuncionario.senha || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, senha: e.target.value })} placeholder={isEditing ? "Deixar em branco para não alterar" : "Senha de acesso"} required={!isEditing} />

                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Perfil de Acesso</label>
                        <select value={currentFuncionario.perfil_id || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, perfil_id: e.target.value ? parseInt(e.target.value) : null })} className="w-full p-2 border rounded-lg bg-white">
                            <option value="">Nenhum Perfil (Acesso Limitado)</option>
                            {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                    </div>

                    <hr className="border-gray-600 my-6" />
                    <h3 className="text-lg font-bold text-white">Horários de Trabalho</h3>
                    <ScheduleEditor value={currentFuncionario.horarios_trabalho || defaultSchedule} onChange={horarios => setCurrentFuncionario({ ...currentFuncionario, horarios_trabalho: horarios })} />
                    <div className="flex justify-end gap-4 pt-4">
                        <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
                        <Button onClick={handleSaveFuncionario} variant="primary">Salvar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}