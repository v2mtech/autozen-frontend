import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

interface Promocao {
  id: number;
  descricao: string;
  valor_meta: number;
  percentual_cashback: number;
  ativo: boolean;
}

export default function CashbackPage() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromocao, setCurrentPromocao] = useState<Partial<Promocao>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // NOVO ESTADO PARA GERENCIAR ERROS
  const [error, setError] = useState<string | null>(null);

  const fetchPromocoes = async () => {
    setLoading(true);
    setError(null); // Limpa erros anteriores
    try {
      const response = await api.get('/cashback/promocoes');
      setPromocoes(response.data as Promocao[]);
    } catch (err: any) {
      // ATUALIZA O ESTADO DE ERRO EM VEZ DE USAR ALERT
      setError(err.response?.data?.error || 'Erro ao buscar promoções.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromocoes();
  }, []);

  const handleOpenModal = (promocao?: Promocao) => {
    if (promocao) {
      setCurrentPromocao(promocao);
      setIsEditing(true);
    } else {
      setCurrentPromocao({});
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSave = async () => {
    setError(null);
    const { id, ...data } = currentPromocao;
    try {
      if (isEditing) {
        await api.put(`/cashback/promocoes/${id}`, data);
      } else {
        await api.post('/cashback/promocoes', data);
      }
      fetchPromocoes();
      handleCloseModal();
    } catch (err: any) {
      // ATUALIZA O ESTADO DE ERRO
      setError(err.response?.data?.error || 'Erro ao salvar promoção.');
    }
  };
  
  const handleToggleStatus = async (promocao: Promocao) => {
    setError(null);
    if (window.confirm(`Deseja ${promocao.ativo ? 'desativar' : 'ativar'} esta promoção?`)) {
        try {
            await api.patch(`/cashback/promocoes/${promocao.id}/status`, { ativo: !promocao.ativo });
            fetchPromocoes();
        } catch (err: any) {
            // ATUALIZA O ESTADO DE ERRO
            setError(err.response?.data?.error || 'Erro ao alterar status.');
        }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Promoções de Cashback</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" className="w-auto">Adicionar Promoção</Button>
      </div>
      
      {/* EXIBE A MENSAGEM DE ERRO SE ELA EXISTIR */}
      {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-center">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Carregando promoções...</p>
      ) : (
        <div className="bg-fundo-secundario rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4">Descrição</th>
                <th className="p-4">Meta (R$)</th>
                <th className="p-4">Cashback (%)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {promocoes.map(promo => (
                <tr key={promo.id} className="border-b border-gray-700">
                  <td className="p-4">{promo.descricao}</td>
                  <td className="p-4">{Number(promo.valor_meta).toFixed(2)}</td>
                  <td className="p-4">{Number(promo.percentual_cashback).toFixed(2)}%</td>
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          promo.ativo ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'
                     }`}>{promo.ativo ? 'Ativa' : 'Inativa'}</span>
                  </td>
                  <td className="p-4 flex gap-4">
                    <button onClick={() => handleOpenModal(promo)} className="text-yellow-400 font-semibold">Editar</button>
                    <button onClick={() => handleToggleStatus(promo)} className={`font-semibold ${promo.ativo ? 'text-red-400' : 'text-green-400'}`}>
                      {promo.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Editar Promoção' : 'Nova Promoção'}>
        <div className="space-y-4">
          <Input label="Descrição da Promoção" value={currentPromocao.descricao || ''} onChange={e => setCurrentPromocao({...currentPromocao, descricao: e.target.value})} placeholder="A cada R$ 1000 gastos, ganhe 5%"/>
          <Input label="Valor da Meta (R$)" type="number" value={currentPromocao.valor_meta || ''} onChange={e => setCurrentPromocao({...currentPromocao, valor_meta: Number(e.target.value)})} />
          <Input label="Percentual de Cashback (%)" type="number" value={currentPromocao.percentual_cashback || ''} onChange={e => setCurrentPromocao({...currentPromocao, percentual_cashback: Number(e.target.value)})} />
          
          {/* Mostra erro dentro do modal também */}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
            <Button onClick={handleSave} variant="primary">Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}