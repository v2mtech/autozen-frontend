import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface ServicoDetalhado {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
}
interface OrdemServicoData {
  id: string;
  data_hora_inicio: { toDate: () => Date };
  desconto_aplicado_valor: number;
  empresa_nome: string;
  empresa_razao_social: string;
  empresa_cnpj: string;
  usuario_nome: string;
  usuario_email: string;
  servicos: ServicoDetalhado[];
}

const formatDateTime = (date: Date) => date.toLocaleString('pt-BR');
const formatCurrency = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
        const osRef = doc(db, 'agendamentos', id);
        const osSnap = await getDoc(osRef);

        if (osSnap.exists()) {
          const data = { id: osSnap.id, ...osSnap.data() } as OrdemServicoData;
          if (!Array.isArray(data.servicos)) {
            data.servicos = [];
          }
          setOs(data);
        } else {
          setError('Ordem de serviço não encontrada.');
        }
      } catch (err) {
        setError('Não foi possível carregar a ordem de serviço.');
      } finally {
        setLoading(false);
      }
    };
    fetchOsDetails();
  }, [id]);

  const subtotal = os?.servicos?.reduce((acc, servico) => acc + parseFloat(servico.preco), 0) || 0;
  const desconto = os?.desconto_aplicado_valor || 0;
  const total = subtotal - desconto;

  if (loading) return <p className="text-center text-texto-secundario">A carregar Ordem de Serviço...</p>;
  if (error) return <p className="text-center text-erro">{error}</p>;
  if (!os) return null;

  return (
    <div className="max-w-4xl mx-auto bg-fundo-secundario p-8 rounded-lg shadow-lg border border-borda">
      <div className="printable-area">
        <header className="flex justify-between items-center pb-6 border-b border-borda">
          <div>
            <h1 className="text-3xl font-bold text-texto-principal">Ordem de Serviço #{os.id.substring(0, 6)}</h1>
            <p className="text-texto-secundario">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-primaria-padrao">{os.empresa_nome}</h2>
            <p className="text-texto-secundario text-sm">{os.empresa_razao_social}</p>
            <p className="text-texto-secundario text-sm">CNPJ: {formatCnpj(os.empresa_cnpj)}</p>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          <div>
            <h3 className="font-semibold text-texto-secundario mb-2">CLIENTE</h3>
            <p className="text-texto-principal font-bold">{os.usuario_nome}</p>
            <p className="text-texto-secundario">{os.usuario_email}</p>
          </div>
          <div className="text-left md:text-right">
            <h3 className="font-semibold text-texto-secundario mb-2">DATA DO SERVIÇO</h3>
            <p className="text-texto-principal font-bold">{formatDateTime(os.data_hora_inicio.toDate())}</p>
          </div>
        </main>

        <section>
          <h3 className="font-semibold text-texto-secundario mb-3 text-lg">DETALHES DOS SERVIÇOS</h3>
          <div className="space-y-4">
            {os.servicos?.map((servico, index) => (
              <div key={index} className="bg-fundo-principal p-4 rounded-lg flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-primaria-padrao">{servico.nome}</h4>
                  <p className="text-texto-secundario mt-1 text-sm">{servico.descricao}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-texto-principal">{formatCurrency(parseFloat(servico.preco))}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h3 className="font-semibold text-texto-secundario mb-3 text-lg">VALORES</h3>
          <div className="bg-fundo-principal p-6 rounded-lg space-y-3">
            <div className="flex justify-between text-texto-secundario">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-green-500">
              <span>Desconto (Voucher)</span>
              <span>- {formatCurrency(desconto)}</span>
            </div>
            <div className="flex justify-between text-texto-principal font-bold text-xl pt-3 border-t border-borda">
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