import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Promocao {
  id: string; // ID do Firestore
  descricao: string;
  valor_meta: number;
  percentual_cashback: number;
  ativo: boolean;
}

export default function CashbackPage() {
  const { user } = useAuth();
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromocao, setCurrentPromocao] = useState<Partial<Promocao>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromocoes = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const promocoesRef = collection(db, 'promocoes_cashback');
      const q = query(promocoesRef, where("empresa_id", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const promocoesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promocao));
      setPromocoes(promocoesList);
    } catch (err: any) {
      setError('Erro ao buscar promoções.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromocoes();
  }, [user]);

  const handleOpenModal = (promocao?: Promocao) => {
    if (promocao) {
      setCurrentPromocao(promocao);
      setIsEditing(true);
    } else {
      setCurrentPromocao({ ativo: true });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    const { id, ...data } = currentPromocao;
    const dataToSave = { ...data, empresa_id: user.uid };
    try {
      if (isEditing && id) {
        const promoRef = doc(db, 'promocoes_cashback', id);
        await updateDoc(promoRef, dataToSave);
      } else {
        await addDoc(collection(db, 'promocoes_cashback'), dataToSave);
      }
      fetchPromocoes();
      handleCloseModal();
    } catch (err: any) {
      setError('Erro ao salvar promoção.');
    }
  };

  const handleToggleStatus = async (promocao: Promocao) => {
    setError(null);
    if (window.confirm(`Deseja ${promocao.ativo ? 'desativar' : 'ativar'} esta promoção?`)) {
      try {
        const promoRef = doc(db, 'promocoes_cashback', promocao.id);
        await updateDoc(promoRef, { ativo: !promocao.ativo });
        fetchPromocoes();
      } catch (err: any) {
        setError('Erro ao alterar status.');
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-texto-principal">Promoções de Cashback</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" className="w-auto">Adicionar Promoção</Button>
      </div>

      {error && <p className="bg-red-100 text-erro p-3 rounded-lg mb-4 text-center">{error}</p>}

      {loading ? (
        <p className="text-texto-secundario">Carregando promoções...</p>
      ) : (
        <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
          <table className="w-full text-left">
            <thead className="border-b border-borda bg-fundo-principal">
              <tr>
                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Descrição</th>
                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Meta (R$)</th>
                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Cashback (%)</th>
                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Status</th>
                <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {promocoes.map(promo => (
                <tr key={promo.id} className="hover:bg-fundo-principal">
                  <td className="p-4 text-texto-principal font-medium">{promo.descricao}</td>
                  <td className="p-4 text-texto-secundario">{Number(promo.valor_meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-4 text-texto-secundario">{Number(promo.percentual_cashback).toFixed(2)}%</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${promo.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{promo.ativo ? 'Ativa' : 'Inativa'}</span>
                  </td>
                  <td className="p-4 flex gap-4">
                    <button onClick={() => handleOpenModal(promo)} className="text-primaria-padrao hover:text-primaria-escuro font-semibold">Editar</button>
                    <button onClick={() => handleToggleStatus(promo)} className={`font-semibold ${promo.ativo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
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
          <Input label="Descrição da Promoção" value={currentPromocao.descricao || ''} onChange={e => setCurrentPromocao({ ...currentPromocao, descricao: e.target.value })} placeholder="A cada R$ 1000 gastos, ganhe 5%" />
          <Input label="Valor da Meta (R$)" type="number" value={currentPromocao.valor_meta || ''} onChange={e => setCurrentPromocao({ ...currentPromocao, valor_meta: Number(e.target.value) })} />
          <Input label="Percentual de Cashback (%)" type="number" value={currentPromocao.percentual_cashback || ''} onChange={e => setCurrentPromocao({ ...currentPromocao, percentual_cashback: Number(e.target.value) })} />

          {error && <p className="text-erro text-sm text-center">{error}</p>}

          <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda">
            <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
            <Button onClick={handleSave} variant="primary">Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}