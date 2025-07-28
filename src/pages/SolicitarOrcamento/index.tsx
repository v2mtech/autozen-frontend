import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';

interface Empresa {
    id: number;
    nome_fantasia: string;
}

export default function SolicitarOrcamentoPage() {
    const navigate = useNavigate();
    const location = useLocation(); // Hook para aceder aos dados de navegação

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState('');
    const [descricao, setDescricao] = useState('');
    const [imagens, setImagens] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Estado para verificar se a empresa foi pré-selecionada
    const [isEmpresaPreselected, setIsEmpresaPreselected] = useState(false);

    useEffect(() => {
        // Verifica se a empresa veio através da navegação
        if (location.state?.empresaId) {
            const { empresaId, empresaNome } = location.state;
            setEmpresas([{ id: empresaId, nome_fantasia: empresaNome }]);
            setSelectedEmpresa(empresaId);
            setIsEmpresaPreselected(true);
        } else {
            // Se não, busca todas as empresas
            api.get('/empresas').then(response => {
                setEmpresas(response.data);
            }).catch(err => {
                console.error("Erro ao carregar empresas", err);
                setError("Não foi possível carregar a lista de lojas.");
            });
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
        if (!selectedEmpresa || !descricao) {
            setError("Por favor, selecione uma loja e descreva o que precisa.");
            return;
        }
        setLoading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('empresa_id', selectedEmpresa);
        formData.append('descricao', descricao);
        formData.append('data_orcamento', new Date().toISOString());
        
        imagens.forEach(imagem => {
            formData.append('imagens', imagem);
        });

        try {
            await api.post('/orcamentos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
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
                            className="w-full px-4 py-3 bg-white border border-borda rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed"
                            required
                            disabled={isEmpresaPreselected} // Desabilita o campo se a empresa já foi selecionada
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
                            className="w-full px-4 py-3 bg-white border border-borda rounded-lg"
                            placeholder="Ex: Gostaria de um orçamento para instalar película nos vidros de um Honda Civic 2022 e fazer um polimento completo."
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Anexar Imagens (até 5)</label>
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
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
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