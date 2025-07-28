import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';

// Interface para um único serviço dentro da OS
interface ServicoDetalhado {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  duracao_minutos: number;
}

// Interface principal para os dados da OS
interface OrdemServicoData {
  id: number;
  data_hora_inicio: string;
  desconto_aplicado_valor: number;
  empresa_nome: string;
  empresa_razao_social: string;
  empresa_cnpj: string;
  usuario_nome: string;
  usuario_email: string;
  servicos: ServicoDetalhado[]; // Espera um array de serviços
}

// Funções de formatação
const formatDateTime = (date: string) => new Date(date).toLocaleString('pt-BR');
const formatCurrency = (value: number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatCnpj = (cnpj: string) => cnpj ? cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : '';

export default function OrdemDeServicoPage() {
  const { id } = useParams<{ id: string }>();
  const [os, setOs] = useState<OrdemServicoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOsDetails = async () => {
      if (!id) return;
      try {
        const response = await api.get<OrdemServicoData>(`/agendamentos/${id}/detalhes`);
        const data = response.data;

        // --- CORREÇÃO DE ROBUSTEZ ADICIONADA AQUI ---
        // Garante que 'servicos' seja sempre um array antes de definir o estado.
        // Isto previne o crash se a API retornar algo que não seja um array.
        if (!Array.isArray(data.servicos)) {
            console.warn("API response for 'servicos' was not an array. Defaulting to []. Data received:", data.servicos);
            data.servicos = [];
        }

        setOs(data);
      } catch (err) {
        setError('Não foi possível carregar a ordem de serviço.');
      } finally {
        setLoading(false);
      }
    };
    fetchOsDetails();
  }, [id]);

  // Garante que o array de serviços existe antes de calcular o subtotal
  const subtotal = os?.servicos?.reduce((acc, servico) => acc + parseFloat(servico.preco), 0) || 0;
  const desconto = os?.desconto_aplicado_valor || 0;
  const total = subtotal - desconto;

  if (loading) return <p className="text-center text-gray-400">A carregar Ordem de Serviço...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!os) return null;

  return (
    <div className="max-w-4xl mx-auto bg-fundo-principal p-8 rounded-lg shadow-2xl">
      <div className="printable-area">
        <header className="flex justify-between items-center pb-6 border-b border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-white">Ordem de Serviço #{String(os.id).padStart(5, '0')}</h1>
            <p className="text-gray-400">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-primaria-claro">{os.empresa_nome}</h2>
            <p className="text-gray-400">{os.empresa_razao_social}</p>
            <p className="text-gray-400">CNPJ: {formatCnpj(os.empresa_cnpj)}</p>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          <div>
            <h3 className="font-semibold text-gray-400 mb-2">CLIENTE</h3>
            <p className="text-white font-bold">{os.usuario_nome}</p>
            <p className="text-gray-300">{os.usuario_email}</p>
          </div>
          <div className="text-left md:text-right">
            <h3 className="font-semibold text-gray-400 mb-2">DATA DO SERVIÇO</h3>
            <p className="text-white font-bold">{formatDateTime(os.data_hora_inicio)}</p>
          </div>
        </main>

        <section>
          <h3 className="font-semibold text-gray-400 mb-3 text-lg">DETALHES DOS SERVIÇOS</h3>
          <div className="space-y-4">
            {os.servicos?.map((servico, index) => (
              <div key={servico.id || index} className="bg-fundo-secundario p-4 rounded-lg flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-primaria-claro">{servico.nome}</h4>
                  <p className="text-gray-300 mt-1 text-sm">{servico.descricao}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">{formatCurrency(parseFloat(servico.preco))}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h3 className="font-semibold text-gray-400 mb-3 text-lg">VALORES</h3>
          <div className="bg-fundo-secundario p-6 rounded-lg space-y-3">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-green-400">
              <span>Desconto (Voucher)</span>
              <span>- {formatCurrency(desconto)}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-xl pt-3 border-t border-gray-700">
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-10 text-center no-print">
        <Button onClick={() => window.print()} variant="primary">
          Imprimir / Guardar PDF
        </Button>
      </footer>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}