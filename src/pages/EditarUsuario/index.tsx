import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { MaskedInput } from '../../components/MaskedInput';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Interfaces para FIPE e Formulário
interface Marca { codigo: string; nome: string; }
interface Modelo { codigo: number; nome: string; }
interface Ano { codigo: string; nome: string; }
interface UserFormData {
    uid: string;
    nome: string;
    email: string;
    // Adicione os outros campos conforme a sua coleção 'usuarios' no Firestore
}

export default function EditarUsuarioPage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Partial<UserFormData>>({});
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // A lógica de busca de CEP e FIPE permanece, pois são APIs externas
    const [cepLoading, setCepLoading] = useState(false);
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [anos, setAnos] = useState<Ano[]>([]);
    const [selectedMarca, setSelectedMarca] = useState('');
    const [selectedModelo, setSelectedModelo] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Busca os dados do perfil do utilizador no Firestore
                const userDocRef = doc(db, "usuarios", user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setFormData({ uid: docSnap.id, ...docSnap.data() });
                } else {
                    setFeedback({ type: 'error', message: 'Perfil não encontrado.' });
                }

                // Busca as marcas de veículos
                const marcasResponse = await api.get<Marca[]>('/veiculos/marcas');
                setMarcas(marcasResponse.data);

            } catch (err) {
                setFeedback({ type: 'error', message: "Não foi possível carregar os seus dados." });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Lógica para buscar modelos e anos (permanece a mesma)
    useEffect(() => { if (selectedMarca) { /* ... */ } }, [selectedMarca]);
    useEffect(() => { if (selectedMarca && selectedModelo) { /* ... */ } }, [selectedModelo, selectedMarca]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setFeedback({ type: '', message: '' });

        const { uid, ...dataToSubmit } = formData;

        try {
            // Atualiza o documento do utilizador no Firestore
            const userDocRef = doc(db, "usuarios", user.uid);
            await updateDoc(userDocRef, dataToSubmit);
            setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: 'Erro ao atualizar o perfil.' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.uid) {
        return <p className="text-center text-gray-400 p-10">A carregar perfil...</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-texto-principal">Editar o Meu Perfil</h1>
            <div className="max-w-5xl mx-auto bg-fundo-secundario p-8 rounded-lg shadow-xl border border-borda">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 border-t border-borda pt-6">
                        <legend className="text-lg font-semibold text-primaria-intermediario px-2 -mb-4">Dados Pessoais</legend>
                        <Input label="Nome Completo" name="nome" value={formData.nome || ''} onChange={handleChange} required />
                        <Input label="Email" type="email" name="email" value={formData.email || ''} onChange={handleChange} required disabled />
                        {/* Outros campos do formulário aqui... */}
                    </fieldset>

                    <div className="pt-4 flex justify-center">
                        <div className="w-full md:w-1/3">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'A guardar...' : 'Guardar Alterações'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}