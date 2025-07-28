import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { bandeirasCartao, bancosBrasil } from '../../data/paymentData';

interface FormaPagamento {
    id: number;
    nome: string;
    tipo: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX';
    bandeiras?: string; // No backend, é uma string separada por vírgulas
    banco_codigo?: string;
    banco_nome?: string;
    agencia?: string;
    conta?: string;
    taxa?: number;
    status: 'ativo' | 'inativo';
}

// Interface para o formulário, onde bandeiras é um array
interface FormaPagamentoForm extends Omit<FormaPagamento, 'bandeiras'> {
    bandeiras?: string[];
}


export default function FormasPagamentoPage() {
    const [formas, setFormas] = useState<FormaPagamento[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentForma, setCurrentForma] = useState<Partial<FormaPagamentoForm>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFormas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/formas-pagamento');
            setFormas(response.data);
        } catch (error) {
            alert('Erro ao carregar formas de pagamento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFormas();
    }, []);

    const handleOpenModal = (forma?: FormaPagamento) => {
        if (forma) {
            const bandeirasArray = typeof forma.bandeiras === 'string' ? forma.bandeiras.split(',') : [];
            setCurrentForma({ ...forma, bandeiras: bandeirasArray });
            setIsEditing(true);
        } else {
            setCurrentForma({ tipo: 'Dinheiro', status: 'ativo', bandeiras: [] });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentForma(prev => ({ ...prev, [name]: value }));
    };
    
    const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bancoSelecionado = bancosBrasil.find(b => b.codigo === e.target.value);
        setCurrentForma(prev => ({
            ...prev,
            banco_codigo: bancoSelecionado?.codigo,
            banco_nome: bancoSelecionado?.nome
        }));
    };
    
    const handleBandeiraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const currentBandeiras = currentForma.bandeiras || [];

        if (checked) {
            // Adiciona a bandeira se não estiver presente
            setCurrentForma(prev => ({ ...prev, bandeiras: [...currentBandeiras, value] }));
        } else {
            // Remove a bandeira
            setCurrentForma(prev => ({ ...prev, bandeiras: currentBandeiras.filter(b => b !== value) }));
        }
    };
    
    const handleSave = async () => {
        const { id, ...data } = currentForma;
        // O backend espera uma string, então convertemos o array
        const dataToSend = {
            ...data,
            bandeiras: data.bandeiras?.join(','),
        };

        try {
            if (isEditing) {
                await api.put(`/formas-pagamento/${id}`, dataToSend);
            } else {
                await api.post('/formas-pagamento', dataToSend);
            }
            fetchFormas();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar a forma de pagamento.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Formas de Pagamento</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Forma</Button>
            </div>
            
            <div className="bg-fundo-secundario rounded-lg shadow-md border border-borda">
                <table className="w-full text-left">
                    <thead className="border-b border-borda">
                        <tr>
                            <th className="p-4 text-texto-secundario">Nome</th>
                            <th className="p-4 text-texto-secundario">Tipo</th>
                            <th className="p-4 text-texto-secundario">Taxa (%)</th>
                            <th className="p-4 text-texto-secundario">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formas.map(forma => (
                            <tr key={forma.id} onClick={() => handleOpenModal(forma)} className="border-b border-borda last:border-b-0 hover:bg-gray-100 cursor-pointer">
                                <td className="p-4 font-semibold text-texto-principal">{forma.nome}</td>
                                <td className="p-4 text-texto-principal">{forma.tipo}</td>
                                <td className="p-4 text-texto-principal">{forma.taxa ? `${Number(forma.taxa).toFixed(2)}%` : '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${forma.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {forma.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'} maxWidthClass="max-w-3xl">
                <div className="space-y-4">
                    <Input label="Nome (Ex: Crédito Loja, Pix Gerente)" name="nome" value={currentForma.nome || ''} onChange={handleChange} required />
                    
                    <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Tipo</label>
                        <select name="tipo" value={currentForma.tipo} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option>Dinheiro</option>
                            <option>Cartão de Crédito</option>
                            <option>Cartão de Débito</option>
                            <option>PIX</option>
                        </select>
                    </div>

                    {/* Campos Condicionais para Cartão */}
                    {(currentForma.tipo === 'Cartão de Crédito' || currentForma.tipo === 'Cartão de Débito') && (
                        <div className="border-t pt-4">
                            <label className="text-sm font-semibold text-texto-secundario">Bandeiras Aceites</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {bandeirasCartao.map(bandeira => (
                                    <label key={bandeira} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                                        <input 
                                            type="checkbox" 
                                            value={bandeira} 
                                            checked={currentForma.bandeiras?.includes(bandeira)}
                                            onChange={handleBandeiraChange}
                                            className="h-4 w-4 rounded text-primaria-padrao focus:ring-primaria-padrao"
                                        />
                                        <span>{bandeira}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Campos Condicionais para Banco */}
                    {(currentForma.tipo !== 'Dinheiro') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <label className="text-sm font-semibold text-texto-secundario block mb-2">Banco Associado</label>
                                <select value={currentForma.banco_codigo || ''} onChange={handleBankChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                    <option value="">Selecione...</option>
                                    {bancosBrasil.map(banco => <option key={banco.codigo} value={banco.codigo}>{banco.codigo} - {banco.nome}</option>)}
                                </select>
                            </div>
                            <Input label="Taxa (%)" name="taxa" type="number" step="0.01" value={currentForma.taxa || ''} onChange={handleChange} />
                            <Input label="Agência" name="agencia" value={currentForma.agencia || ''} onChange={handleChange} />
                            <Input label="Conta" name="conta" value={currentForma.conta || ''} onChange={handleChange} />
                        </div>
                    )}

                     <div>
                        <label className="text-sm font-semibold text-texto-secundario block mb-2">Status</label>
                        <select name="status" value={currentForma.status || 'ativo'} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
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