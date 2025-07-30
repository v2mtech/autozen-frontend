import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';

interface Empresa {
    id: string;
    nome_fantasia: string;
}

export default function SolicitarOrcamentoPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth(); // Utilizador logado do Firebase

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState('');
    const [descricao, setDescricao] = useState('');
    const [imagens, setImagens] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [isEmpresaPreselected, setIsEmpresaPreselected] = useState(false);

    useEffect(() => {
        const fetchEmpresas = async () => {
            const empresasRef = collection(db, 'empresas');
            const snapshot = await getDocs(empresasRef);
            const listaEmpresas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Empresa));
            setEmpresas(listaEmpresas);
        };

        if (location.state?.empresaId) {
            const { empresaId, empresaNome } = location.state;
            setEmpresas([{ id: empresaId, nome_fantasia: empresaNome }]);
            setSelectedEmpresa(empresaId);
            setIsEmpresaPreselected(true);
        } else {
            fetchEmpresas().catch(err => setError("Não foi possível carregar a lista de lojas."));
        }
    }, [location.state]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (imagens.length + filesArray.length > 5) {
                alert("Pode anexar no máximo 5 imagens.");
                return;
            }
            setImagens(prev => [...prev, ...filesArray]);
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImagens(prev => prev.filter((_, index) => index !== indexToRemove));
        setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedEmpresa || !descricao) {
            setError("Por favor, selecione uma loja e descreva o que precisa.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            // 1. Criar o documento do orçamento no Firestore
            const orcamentoData = {
                empresa_id: selectedEmpresa,
                usuario_id: user.uid,
                descricao: descricao,
                data_orcamento: new Date(),
                status: 'solicitado',
                imagens: [] // Array que irá armazenar as URLs das imagens
            };

            const docRef = await addDoc(collection(db, 'orcamentos'), orcamentoData);

            // 2. Fazer o upload das imagens para o Cloud Storage
            const imageUrls: string[] = [];
            for (const imagem of imagens) {
                const imageRef = ref(storage, `orcamentos/${docRef.id}/${imagem.name}`);
                const snapshot = await uploadBytes(imageRef, imagem);
                const downloadURL = await getDownloadURL(snapshot.ref);
                imageUrls.push(downloadURL);
            }

            // 3. Atualizar o documento do orçamento com as URLs das imagens
            if (imageUrls.length > 0) {
                await updateDoc(docRef, { imagens: imageUrls });
            }

            alert('Orçamento solicitado com sucesso!');
            navigate('/meus-orcamentos');
        } catch (err) {
            setError("Ocorreu um erro ao enviar a sua solicitação. Tente novamente.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-texto-principal">Solicitar Novo Orçamento</h1>
            <div className="max-w-2xl bg-fundo-secundario p-8 rounded-lg shadow-md border border-borda">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Para qual loja é o orçamento?</label>
                        <select
                            value={selectedEmpresa}
                            onChange={e => setSelectedEmpresa(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-borda rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed text-texto-principal"
                            required
                            disabled={isEmpresaPreselected}
                        >
                            <option value="" disabled>Selecione uma loja...</option>
                            {empresas.map(empresa => (
                                <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Descreva o que precisa</label>
                        <textarea
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 bg-white border border-borda rounded-lg text-texto-principal"
                            placeholder="Ex: Gostaria de um orçamento para instalar película nos vidros de um Honda Civic 2022 e fazer um polimento completo."
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Anexar Imagens (até 5)</label>
                        <p className="text-xs text-texto-secundario mb-3">Coloque as imagens do seu carro para agilizar o seu orçamento.</p>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primaria-padrao file:text-white hover:file:bg-primaria-escuro"
                        />
                        <div className="mt-4 grid grid-cols-5 gap-2">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview} alt="Pré-visualização" className="w-full h-24 object-cover rounded-md" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute top-0 right-0 bg-erro text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                                    >&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-erro text-sm text-center">{error}</p>}

                    <div className="pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'A enviar...' : 'Enviar Solicitação'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}