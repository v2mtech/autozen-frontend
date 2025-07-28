import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

// Lista de todas as permissões possíveis no sistema
const todasAsPermissoes = {
    gestao: [
        { id: 'ver_dashboard', label: 'Ver Dashboard' },
        { id: 'ver_quadro_os', label: 'Ver Quadro OS' },
        { id: 'ver_orcamentos', label: 'Ver Orçamentos' },
        { id: 'ver_agenda', label: 'Ver Agenda' },
    ],
    cadastros: [
        { id: 'gerir_servicos', label: 'Gerir Serviços e Grupos' },
        { id: 'gerir_produtos', label: 'Gerir Produtos e Grupos' },
        { id: 'gerir_fornecedores', label: 'Gerir Fornecedores' },
        { id: 'gerir_funcionarios', label: 'Gerir Funcionários' },
    ],
    financeiro: [
        { id: 'ver_relatorios_financeiros', label: 'Ver Relatórios (DRE, Faturamento, etc.)' },
        { id: 'gerir_contas', label: 'Gerir Contas a Pagar/Receber' },
        { id: 'gerir_comissoes', label: 'Gerir Comissões' },
    ],
    fiscal: [
        { id: 'gerir_regras_fiscais', label: 'Gerir Regras Fiscais' },
        { id: 'emitir_notas_fiscais', label: 'Emitir Notas Fiscais' },
    ],
};

interface Perfil {
    id: number;
    nome: string;
    permissoes: string[];
}

export default function PerfisFuncionariosPage() {
    const [perfis, setPerfis] = useState<Perfil[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPerfil, setCurrentPerfil] = useState<Partial<Perfil>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/perfis-funcionarios');
            const perfisData = response.data.map((p: any) => ({
                ...p,
                permissoes: typeof p.permissoes === 'string' ? JSON.parse(p.permissoes) : p.permissoes || []
            }));
            setPerfis(perfisData);
        } catch (error) {
            alert('Erro ao carregar perfis.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (perfil?: Perfil) => {
        if (perfil) {
            setCurrentPerfil(perfil);
            setIsEditing(true);
        } else {
            setCurrentPerfil({ nome: '', permissoes: [] });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handlePermissionChange = (permissionId: string, isChecked: boolean) => {
        setCurrentPerfil(prev => {
            const currentPermissions = prev.permissoes || [];
            if (isChecked) {
                return { ...prev, permissoes: [...currentPermissions, permissionId] };
            } else {
                return { ...prev, permissoes: currentPermissions.filter(p => p !== permissionId) };
            }
        });
    };

    const handleSave = async () => {
        const { id, ...data } = currentPerfil;
        if (!data.nome) {
            alert("O nome do perfil é obrigatório.");
            return;
        }

        try {
            if (isEditing) {
                await api.put(`/perfis-funcionarios/${id}`, data);
            } else {
                await api.post('/perfis-funcionarios', data);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar o perfil.');
        }
    };

    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Perfis de Funcionário</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Perfil</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-md p-4 border border-borda">
                {perfis.map(perfil => (
                    <div key={perfil.id} onClick={() => handleOpenModal(perfil)} className="p-3 border-b border-borda last:border-b-0 cursor-pointer hover:bg-gray-100">
                        <p className="font-bold text-texto-principal">{perfil.nome}</p>
                        <p className="text-sm text-texto-secundario">{perfil.permissoes.length} permissões</p>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Perfil' : 'Novo Perfil'} maxWidthClass="max-w-3xl">
                <div className="space-y-6">
                    <Input label="Nome do Perfil" name="nome" value={currentPerfil.nome || ''} onChange={e => setCurrentPerfil(prev => ({ ...prev, nome: e.target.value }))} />
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Permissões de Acesso</h3>
                        <div className="space-y-4">
                            {Object.entries(todasAsPermissoes).map(([categoria, permissoes]) => (
                                <div key={categoria}>
                                    <h4 className="font-bold capitalize text-texto-principal border-b border-borda pb-1 mb-2">{categoria}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {permissoes.map(p => (
                                            <label key={p.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={currentPerfil.permissoes?.includes(p.id)}
                                                    onChange={e => handlePermissionChange(p.id, e.target.checked)}
                                                    className="h-4 w-4 rounded"
                                                />
                                                <span className="text-sm">{p.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar Perfil</Button>
                </div>
            </Modal>
        </div>
    );
}