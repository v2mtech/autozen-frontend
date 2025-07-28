import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import UserLayout from '../layouts/UserLayout';
import AuthLayout from '../layouts/AuthLayout';

// Páginas Públicas
import LoginPage from '../pages/Login';
import LoginUsuarioPage from '../pages/LoginUsuario';
import LoginEmpresaPage from '../pages/LoginEmpresa';
import CadastroEmpresaPage from '../pages/CadastroEmpresa';
import CadastroUsuarioPage from '../pages/CadastroUsuario';

// Páginas da Empresa
import DashboardPage from '../pages/Dashboard';
import ServicosPage from '../pages/Servicos';
import AgendaPage from '../pages/Agenda';

import OrdemDeServicoEmpresaPage from '../pages/OrdemDeServicoEmpresa';
import CashbackPage from '../pages/Cashback';
import EditarEmpresaPage from '../pages/EditarEmpresa';
import FuncionariosPage from '../pages/Funcionarios';
import FaturamentoPage from '../pages/Faturamento';
import MailingPage from '../pages/Mailing';
import MeusVideosPage from '../pages/MeusVideos';
import MinhasAvaliacoesPage from '../pages/MinhasAvaliacoes';
import GruposPage from '../pages/Grupos';
import FornecedoresPage from '../pages/Fornecedores';
import ProdutosPage from '../pages/Produtos';
import RegrasFiscaisPage from '../pages/RegrasFiscais';
import FormasPagamentoPage from '../pages/FormasPagamento';
import CondicoesPagamentoPage from '../pages/CondicoesPagamento';
import OrcamentosKanbanPage from '../pages/OrcamentosKanban';
import OrcamentoDetalhePage from '../pages/OrcamentoDetalhe';

// Páginas do Cliente
import HomeUsuarioPage from '../pages/HomeUsuario';
import DetalhesEmpresaPage from '../pages/DetalhesEmpresa';
import MeusAgendamentosPage from '../pages/MeusAgendamentos';
import MeusVouchersPage from '../pages/MeusVouchers';
import OrdemDeServicoPage from '../pages/OrdemDeServico';
import EditarUsuarioPage from '../pages/EditarUsuario';
import MeusOrcamentosPage from '../pages/MeusOrcamentos';
import SolicitarOrcamentoPage from '../pages/SolicitarOrcamento';
import KanbanPage from '../pages/kanban';
import GruposServicosPage from '../pages/GruposServicos';
import GestaoComissoesPage from '../pages/GestaoComissoes';
import RelatorioComissoesPage from '../pages/RelatorioComissoes';
import MinhasOrdensDeServicoPage from '../pages/MinhasOrdensDeServico';
import NotasFiscaisPage from '../pages/NotasFiscais';
import EstoquePage from '../pages/Estoque';
import CurvaABCPage from '../pages/CurvaABC';
import AuditoriaEstoquePage from '../pages/AuditoriaEstoque';
import FechamentoEstoquePage from '../pages/FechamentoEstoque';
import PosicaoEstoquePage from '../pages/PosicaoEstoque';
import DREPage from '../pages/DRE';
import CampanhasMarketingPage from '../pages/CampanhasMarketing';
import ChecklistPage from '../pages/Checklist';
import HistoricoClientePage from '../pages/HistoricoCliente';
import HistoricoVeiculoPage from '../pages/HistoricoVeiculo';
import ContasPagarPage from '../pages/ContasPagar';
import ContasReceberPage from '../pages/ContasReceber';
import FluxoCaixaPage from '../pages/FluxoCaixa';
import PerfisFuncionariosPage from '../pages/PerfisFuncionarios';
import ManuaisPage from '../pages/Manuais';
import EntradaNotaPage from '../pages/EntradaNota';

function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { userType, token, loading } = useAuth();
  if (loading) return <div>A carregar...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return allowedRoles.includes(userType || '') ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/usuario" element={<LoginUsuarioPage />} />
        <Route path="/login/empresa" element={<LoginEmpresaPage />} />
        <Route path="/cadastro/empresa" element={<CadastroEmpresaPage />} />
        <Route path="/cadastro/usuario" element={<CadastroUsuarioPage />} />
      </Route>

      {/* ✅ CORREÇÃO APLICADA AQUI ✅ */}
      {/* Adicionado 'funcionario' à lista de perfis permitidos para aceder ao dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['empresa', 'funcionario']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/orcamentos-kanban" element={<OrcamentosKanbanPage />} />
          <Route path="/orcamento/:id" element={<OrcamentoDetalhePage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/ordem-de-servico/:id" element={<OrdemDeServicoEmpresaPage />} />
          <Route path="/grupos-servicos" element={<GruposServicosPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/grupos" element={<GruposPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/fornecedores" element={<FornecedoresPage />} />
          <Route path="/regras-fiscais" element={<RegrasFiscaisPage />} />
          <Route path="/formas-pagamento" element={<FormasPagamentoPage />} />
          <Route path="/condicoes-pagamento" element={<CondicoesPagamentoPage />} />
          <Route path="/avaliacoes" element={<MinhasAvaliacoesPage />} />
          <Route path="/gerenciar-videos" element={<MeusVideosPage />} />
          <Route path="/funcionarios" element={<FuncionariosPage />} />
          <Route path="/faturamento" element={<FaturamentoPage />} />
          <Route path="/mailing" element={<MailingPage />} />
          <Route path="/cashback" element={<CashbackPage />} />
          <Route path="/editar-empresa" element={<EditarEmpresaPage />} />
          <Route path="/gestao-comissoes" element={<GestaoComissoesPage />} />
          <Route path="/relatorio-comissoes" element={<RelatorioComissoesPage />} />
          <Route path="/notas-fiscais" element={<NotasFiscaisPage />} />
          <Route path="/curva-abc" element={<CurvaABCPage />} />
          <Route path="/auditoria-estoque" element={<AuditoriaEstoquePage />} />
          <Route path="/fechamento-estoque" element={<FechamentoEstoquePage />} />
          <Route path="/posicao-estoque" element={<PosicaoEstoquePage />} />
          <Route path="/dre" element={<DREPage />} />
          <Route path="/marketing-ia" element={<CampanhasMarketingPage />} />
          <Route path="/checklist/:agendamentoId" element={<ChecklistPage />} />
          <Route path="/historico-cliente" element={<HistoricoClientePage />} />
          <Route path="/historico-veiculo" element={<HistoricoVeiculoPage />} />
          <Route path="/contas-a-pagar" element={<ContasPagarPage />} />
          <Route path="/contas-a-receber" element={<ContasReceberPage />} />
          <Route path="/fluxo-caixa" element={<FluxoCaixaPage />} />
          <Route path="/perfis-funcionarios" element={<PerfisFuncionariosPage />} />
          <Route path="/manuais" element={<ManuaisPage />} />
          <Route path="/entrada-nota" element={<EntradaNotaPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['usuario']} />}>
        <Route element={<UserLayout />}>
          <Route path="/home-usuario" element={<HomeUsuarioPage />} />
          <Route path="/empresas/:id" element={<DetalhesEmpresaPage />} />
          <Route path="/meus-orcamentos" element={<MeusOrcamentosPage />} />
          <Route path="/solicitar-orcamento" element={<SolicitarOrcamentoPage />} />
          <Route path="/meus-agendamentos" element={<MeusAgendamentosPage />} />
          <Route path="/meus-vouchers" element={<MeusVouchersPage />} />
          <Route path="/ordem-de-servico/:id" element={<OrdemDeServicoPage />} />
          <Route path="/editar-usuario" element={<EditarUsuarioPage />} />
          <Route path="/minhas-ordens-de-servico" element={<MinhasOrdensDeServicoPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}