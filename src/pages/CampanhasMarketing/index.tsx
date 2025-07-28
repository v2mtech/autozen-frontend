import React, { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';

export default function CampanhasMarketingPage() {
    const [objetivo, setObjetivo] = useState('');
    const [textoGerado, setTextoGerado] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGerarTexto = async () => {
        if (!objetivo) {
            setError('Por favor, descreva o objetivo da campanha.');
            return;
        }
        setLoading(true);
        setError('');
        setTextoGerado('');
        try {
            const response = await api.post('/marketing/gerar-campanha', { objetivo });
            setTextoGerado(response.data.texto);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao gerar o texto da campanha.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Marketing com IA</h1>
            <p className="text-texto-secundario mb-8">Descreva o objetivo da sua campanha de e-mail e deixe a Inteligência Artificial do Google criar o texto para você.</p>
            
            <div className="bg-fundo-secundario rounded-lg shadow-lg p-8 space-y-6">
                <div>
                    <label className="text-sm font-semibold text-texto-secundario block mb-2">Qual é o objetivo da sua campanha?</label>
                    <textarea 
                        value={objetivo}
                        onChange={e => setObjetivo(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-borda rounded-lg text-gray-800"
                        placeholder="Ex: Oferecer 20% de desconto no polimento para clientes que não compram há mais de 6 meses."
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleGerarTexto} disabled={loading} className="w-auto">
                        {loading ? 'A gerar...' : 'Gerar Texto com IA'}
                    </Button>
                </div>

                {error && <p className="text-erro text-center mt-4">{error}</p>}
                
                {textoGerado && (
                    <div className="border-t border-borda pt-6 mt-6">
                        <h2 className="text-xl font-semibold mb-4">Texto Gerado pela IA:</h2>
                        <div 
                            className="bg-white p-6 rounded-lg text-gray-800 prose"
                            dangerouslySetInnerHTML={{ __html: textoGerado }}
                        />
                         <p className="text-xs text-texto-secundario mt-4">Pode copiar este texto e usar no seu serviço de e-mail marketing.</p>
                    </div>
                )}
            </div>
        </div>
    );
}