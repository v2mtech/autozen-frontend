
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useEffect, useState } from 'react';

// Interface simplificada apenas para Grupos de Produto
interface Grupo {
    id: number;
    nome: string;
    codigo: string;
    descricao: string;
    classificacao: string;
}

export default function GruposPage() {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGrupo, setCurrentGrupo] = useState<Partial<Grupo>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Busca apenas os grupos de produto
            const gruposRes = await api.get('/grupos');
            setGrupos(gruposRes.data);
        } catch (error) {
            alert('Erro ao carregar dados da página.');
        } finally {
            setLoading(false);
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
        setCurrentGrupo(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // Envia apenas os dados relevantes para o grupo de produtos
        const { id, ...data } = currentGrupo;
        try {
            if (isEditing) {
                await api.put(`/grupos/${id}`, data);
            } else {
                await api.post('/grupos', data);
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
                <h1 className="text-4xl font-bold text-texto-principal">Grupos de Produtos</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Grupo</Button>
            </div>
            
            <div className="bg-fundo-secundario rounded-lg shadow-md p-4 border border-borda">
                {grupos.map(grupo => (
                    <div key={grupo.id} onClick={() => handleOpenModal(grupo)} className="p-3 border-b border-borda last:border-b-0 cursor-pointer hover:bg-gray-100">
                        <p className="font-bold text-texto-principal">{grupo.nome}</p>
                        <p className="text-sm text-texto-secundario">{grupo.descricao}</p>
                    </div>
                ))}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Grupo' : 'Novo Grupo'}>
                <div className="space-y-4">
                    <Input label="Nome" name="nome" value={currentGrupo.nome || ''} onChange={handleChange} />
                    <Input label="Código" name="codigo" value={currentGrupo.codigo || ''} onChange={handleChange} />
                    <Input label="Descrição" name="descricao" value={currentGrupo.descricao || ''} onChange={handleChange} />
                    <Input label="Classificação" name="classificacao" value={currentGrupo.classificacao || ''} onChange={handleChange} />
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}