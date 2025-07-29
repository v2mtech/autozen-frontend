import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

// --- INTERFACES ---
interface HorariosDisponibilidade {
  [dia: string]: string[];
}

interface Servico {
  id: number;
  nome: string;
  descricao: string;
  duracao_minutos: number;
  preco: number;
  custo_servico?: number;
  horarios_disponibilidade: HorariosDisponibilidade | null;
  grupo_id?: number;
  regra_fiscal_id?: number;
}

interface GrupoServico {
  id: number;
  nome: string;
  regra_fiscal_id?: number;
}

interface RegraFiscal {
  id: number;
  nome_regra: string;
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

// --- COMPONENTE AUXILIAR PARA EDITAR HORÁRIOS ---
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
        <div key={dia} className="flex items-center gap-4 p-2 rounded-lg bg-fundo-principal">
          <input type="checkbox" id={`check-${dia}`} checked={value[dia]?.length > 0} onChange={() => handleDayToggle(dia)} className="h-5 w-5 rounded text-primaria-padrao focus:ring-primaria-padrao" />
          <label htmlFor={`check-${dia}`} className="capitalize w-20 text-texto-principal">{dia}</label>
          {value[dia]?.length > 0 ? <Input type="text" value={value[dia][0] || ''} onChange={e => handleTimeChange(dia, 0, e.target.value)} placeholder="ex: 09:00-18:00" /> : <p className="text-sm text-texto-secundario">Folga</p>}
        </div>
      ))}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentServico, setCurrentServico] = useState<Partial<Servico>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [grupos, setGrupos] = useState<GrupoServico[]>([]);
  const [regrasFiscais, setRegrasFiscais] = useState<RegraFiscal[]>([]);

  const defaultSchedule: HorariosDisponibilidade = {
    domingo: [], segunda: ['09:00-18:00'], terca: ['09:00-18:00'],
    quarta: ['09:00-18:00'], quinta: ['09:00-18:00'], sexta: ['09:00-18:00'], sabado: [],
  };

  const fetchData = async () => {
    try {
      const [servicosRes, gruposRes, regrasRes] = await Promise.all([
        api.get('/servicos'),
        api.get('/servico-grupos'),
        api.get('/regras-fiscais')
      ]);
      setServicos(servicosRes.data as Servico[]);
      setGrupos(gruposRes.data as GrupoServico[]);
      setRegrasFiscais(regrasRes.data as RegraFiscal[]);
    } catch (error) {
      alert('Erro ao carregar dados da página.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (servico?: Servico) => {
    if (servico) {
      setCurrentServico({ ...servico, horarios_disponibilidade: servico.horarios_disponibilidade || defaultSchedule });
      setIsEditing(true);
    } else {
      setCurrentServico({ horarios_disponibilidade: defaultSchedule });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      try {
        await api.delete(`/servicos/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Não foi possível excluir o serviço.');
      }
    }
  };

  const handleGrupoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const grupoId = e.target.value;
    const grupoSelecionado = grupos.find(g => g.id === parseInt(grupoId));

    setCurrentServico(prev => {
      const newState: Partial<Servico> = { ...prev, grupo_id: grupoId ? parseInt(grupoId) : undefined };
      if (grupoSelecionado && grupoSelecionado.regra_fiscal_id) {
        newState.regra_fiscal_id = grupoSelecionado.regra_fiscal_id;
      } else {
        newState.regra_fiscal_id = undefined;
      }
      return newState;
    });
  };

  const handleSave = async () => {
    const { id, ...data } = currentServico;
    try {
      if (isEditing) {
        await api.put(`/servicos/${id}`, data);
      } else {
        await api.post('/servicos', data);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      alert('Erro ao salvar serviço.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-texto-principal">Meus Serviços</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" className="w-auto">Adicionar Serviço</Button>
      </div>

      <div className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
        <table className="w-full text-left">
          <thead className="border-b border-borda bg-fundo-principal">
            <tr>
              <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Nome do Serviço</th>
              <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Duração (min)</th>
              <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Preço (R$)</th>
              <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {servicos.map(servico => (
              <tr key={servico.id} className="hover:bg-fundo-principal">
                <td className="p-4 font-medium text-texto-principal">{servico.nome}</td>
                <td className="p-4 text-texto-secundario">{servico.duracao_minutos}</td>
                <td className="p-4 text-texto-secundario">{Number(servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-4 flex gap-4">
                  <button onClick={() => handleOpenModal(servico)} className="text-primaria-padrao hover:text-primaria-escuro font-semibold">Editar</button>
                  <button onClick={() => handleDelete(servico.id)} className="text-erro hover:opacity-75 font-semibold">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Editar Serviço' : 'Novo Serviço'}>
        <div className="space-y-4">
          <Input label="Nome" value={currentServico.nome || ''} onChange={e => setCurrentServico({ ...currentServico, nome: e.target.value })} />
          <Input label="Descrição" value={currentServico.descricao || ''} onChange={e => setCurrentServico({ ...currentServico, descricao: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Duração (minutos)" type="number" value={currentServico.duracao_minutos || ''} onChange={e => setCurrentServico({ ...currentServico, duracao_minutos: Number(e.target.value) })} />
            <Input label="Preço de Venda (R$)" type="number" value={currentServico.preco || ''} onChange={e => setCurrentServico({ ...currentServico, preco: Number(e.target.value) })} />
            <Input label="Custo do Serviço (R$)" type="number" value={currentServico.custo_servico || ''} onChange={e => setCurrentServico({ ...currentServico, custo_servico: Number(e.target.value) })} placeholder="Materiais, etc." />
          </div>

          <hr className="border-borda my-6" />
          <h3 className="text-lg font-bold text-texto-principal">Associações</h3>
          <div>
            <label className="text-sm font-semibold text-texto-secundario block mb-2">Grupo de Serviço (Opcional)</label>
            <select name="grupo_id" onChange={handleGrupoChange} value={currentServico.grupo_id || ''} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
              <option value="">Nenhum</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-texto-secundario block mb-2">Regra Fiscal (Opcional)</label>
            <select
              name="regra_fiscal_id"
              onChange={e => setCurrentServico({ ...currentServico, regra_fiscal_id: e.target.value ? parseInt(e.target.value) : undefined })}
              value={currentServico.regra_fiscal_id || ''}
              className="w-full px-4 py-3 bg-white border border-borda rounded-lg"
              disabled={!!(grupos.find(g => g.id === currentServico.grupo_id)?.regra_fiscal_id)}
            >
              <option value="">Selecione...</option>
              {regrasFiscais.map(r => <option key={r.id} value={r.id}>{r.nome_regra}</option>)}
            </select>
            {!!(grupos.find(g => g.id === currentServico.grupo_id)?.regra_fiscal_id) && (
              <p className="text-xs text-texto-secundario mt-1">A regra fiscal é definida pelo grupo selecionado.</p>
            )}
          </div>

          <hr className="border-borda my-6" />
          <h3 className="text-lg font-bold text-texto-principal">Horários de Disponibilidade</h3>
          <ScheduleEditor
            value={currentServico.horarios_disponibilidade || defaultSchedule}
            onChange={horarios => setCurrentServico({ ...currentServico, horarios_disponibilidade: horarios })}
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
            <Button onClick={handleSave} variant="primary">Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}