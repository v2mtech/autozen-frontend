import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import {
    FaTachometerAlt, FaClipboardList, FaFileSignature, FaCalendarAlt, FaBoxOpen, FaCogs,
    FaTags, FaWarehouse, FaExchangeAlt, FaTruck, FaChartPie, FaUserTie, FaPercentage,
    FaChartLine, FaFileInvoiceDollar, FaMoneyBillWave, FaFileAlt, FaGift, FaBalanceScale,
    FaFileInvoice, FaUsers, FaStar, FaVideo, FaBuilding, FaChevronLeft, FaChevronRight,
    FaSignOutAlt, FaBars, FaBrain,
    FaHistory,
    FaKey,
    FaQuestionCircle, FaFileUpload
} from 'react-icons/fa';

// --- Tipagem dos Ícones ---
const IconTachometer = FaTachometerAlt as React.ElementType;
const IconClipboardList = FaClipboardList as React.ElementType;
const IconFileSignature = FaFileSignature as React.ElementType;
const IconCalendarAlt = FaCalendarAlt as React.ElementType;
const IconCogs = FaCogs as React.ElementType;
const IconBoxOpen = FaBoxOpen as React.ElementType;
const IconTags = FaTags as React.ElementType;
const IconWarehouse = FaWarehouse as React.ElementType;
const IconExchangeAlt = FaExchangeAlt as React.ElementType;
const IconTruck = FaTruck as React.ElementType;
const IconChartPie = FaChartPie as React.ElementType;
const IconUserTie = FaUserTie as React.ElementType;
const IconPercentage = FaPercentage as React.ElementType;
const IconChartLine = FaChartLine as React.ElementType;
const IconFileInvoiceDollar = FaFileInvoiceDollar as React.ElementType;
const IconMoneyBillWave = FaMoneyBillWave as React.ElementType;
const IconFileAlt = FaFileAlt as React.ElementType;
const IconGift = FaGift as React.ElementType;
const IconBalanceScale = FaBalanceScale as React.ElementType;
const IconFileInvoice = FaFileInvoice as React.ElementType;
const IconUsers = FaUsers as React.ElementType;
const IconStar = FaStar as React.ElementType;
const IconVideo = FaVideo as React.ElementType;
const IconBuilding = FaBuilding as React.ElementType;
const IconChevronLeft = FaChevronLeft as React.ElementType;
const IconChevronRight = FaChevronRight as React.ElementType;
const IconSignOutAlt = FaSignOutAlt as React.ElementType;
const IconBars = FaBars as React.ElementType;
const IconBrain = FaBrain as React.ElementType;
const IconHistory = FaHistory as React.ElementType;
const IconKey = FaKey as React.ElementType;
const IconQuestionCircle = FaQuestionCircle as React.ElementType;
const IconFileUpload = FaFileUpload as React.ElementType;

interface Empresa {
    id: number;
    nome_empresa: string;
    email: string;
}

interface NavItem {
    path: string;
    label: string;
    icon: React.ElementType;
    permission?: string; // Permissão necessária para acessar o link
}

interface NavCategory {
    title: string;
    icon: React.ElementType;
    links: NavItem[];
}

// Estrutura de navegação com categorias e links
const navigationStructure: NavCategory[] = [
    {
        title: 'GESTÃO', icon: IconTachometer,
        links: [
            { path: '/dashboard', label: 'Início', icon: IconTachometer, permission: 'ver_dashboard' },
            { path: '/kanban', label: 'Quadro OS', icon: IconClipboardList, permission: 'ver_quadro_os' },
            { path: '/orcamentos-kanban', label: 'Orçamentos Kanban', icon: IconFileSignature, permission: 'ver_orcamentos' },
            { path: '/agenda', label: 'Agenda', icon: IconCalendarAlt, permission: 'ver_agenda' },
            { path: '/historico-cliente', label: 'Histórico de Clientes', icon: IconUsers, permission: 'ver_dashboard' }, // Exemplo de permissão
        ]
    },
    {
        title: 'SERVIÇOS', icon: IconCogs,
        links: [
            { path: '/grupos-servicos', label: 'Grupos de Serviços', icon: IconCogs, permission: 'gerir_servicos' },
            { path: '/servicos', label: 'Serviços', icon: IconBoxOpen, permission: 'gerir_servicos' },
        ]
    },
    {
        title: 'PRODUTOS E ESTOQUE', icon: IconWarehouse,
        links: [
            { path: '/grupos', label: 'Grupos de Produtos', icon: IconCogs, permission: 'gerir_produtos' },
            { path: '/produtos', label: 'Produtos', icon: IconTags, permission: 'gerir_produtos' },
            { path: '/estoque', label: 'Estoque', icon: IconWarehouse, permission: 'gerir_produtos' },
            { path: '/fechamento-estoque', label: 'Fechamento de Estoque', icon: IconExchangeAlt, permission: 'gerir_produtos' },
            { path: '/fornecedores', label: 'Fornecedores', icon: IconTruck, permission: 'gerir_fornecedores' },
            { path: '/entrada-nota', label: 'Entrada por XML', icon: IconFileUpload, permission: 'gerir_produtos' },
            { path: '/posicao-estoque', label: 'Posição do Estoque', icon: IconChartPie, permission: 'ver_relatorios_financeiros' },
        ]
    },
    {
        title: 'FUNCIONARIOS', icon: IconUserTie,
        links: [
            { path: '/funcionarios', label: 'Funcionários', icon: IconUserTie, permission: 'gerir_funcionarios' },
            { path: '/gestao-comissoes', label: 'Gestão de Comissões', icon: IconPercentage, permission: 'gerir_comissoes' },
            { path: '/relatorio-comissoes', label: 'Relatório de Comissões', icon: IconChartLine, permission: 'ver_relatorios_financeiros' },
            { path: '/perfis-funcionarios', label: 'Perfis de Acesso', icon: IconKey, permission: 'gerir_funcionarios' }
        ]
    },
    {
        title: 'FINANCEIRO', icon: IconFileInvoiceDollar,
        links: [
            { path: '/faturamento', label: 'Faturamento', icon: IconFileInvoiceDollar, permission: 'ver_relatorios_financeiros' },
            { path: '/dre', label: 'DRE (Resultado)', icon: IconBalanceScale, permission: 'ver_relatorios_financeiros' },
            { path: '/contas-a-pagar', label: 'Contas a Pagar', icon: IconMoneyBillWave, permission: 'gerir_contas' },
            { path: '/contas-a-receber', label: 'Contas a Receber', icon: IconMoneyBillWave, permission: 'gerir_contas' },
            { path: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: IconChartPie, permission: 'ver_relatorios_financeiros' },
            { path: '/formas-pagamento', label: 'Formas de Pagamento', icon: IconMoneyBillWave, permission: 'gerir_contas' },
            { path: '/condicoes-pagamento', label: 'Condições de Pagamento', icon: IconFileAlt, permission: 'gerir_contas' },
            { path: '/cashback', label: 'Cashback', icon: IconGift, permission: 'gerir_servicos' }, // Exemplo
            { path: '/curva-abc', label: 'Curva ABC', icon: IconChartPie, permission: 'ver_relatorios_financeiros' },
            { path: '/auditoria-estoque', label: 'Auditoria de Estoque', icon: IconFileAlt, permission: 'ver_relatorios_financeiros' },
        ]
    },
    {
        title: 'FISCAL', icon: IconBalanceScale,
        links: [
            { path: '/regras-fiscais', label: 'Regras Fiscais', icon: IconBalanceScale, permission: 'gerir_regras_fiscais' },
            { path: '/notas-fiscais', label: 'Notas Emitidas', icon: IconFileInvoice, permission: 'emitir_notas_fiscais' },
        ]
    },
    {
        title: 'RELACIONAMENTO', icon: IconUsers,
        links: [
            { path: '/mailing', label: 'Mailing de Clientes', icon: IconUsers, permission: 'ver_dashboard' },
            { path: '/avaliacoes', label: 'Avaliações', icon: IconStar, permission: 'ver_dashboard' },
            { path: '/marketing-ia', label: 'Marketing com IA', icon: IconBrain, permission: 'ver_dashboard' },
            { path: '/historico-veiculo', label: 'Histórico por Placa', icon: IconHistory, permission: 'ver_dashboard' },
        ]
    },
    {
        title: 'CONFIGURAÇÕES', icon: IconCogs,
        links: [
            { path: '/gerenciar-videos', label: 'Gerir Vídeos', icon: IconVideo, permission: 'gerir_servicos' },
            { path: '/editar-empresa', label: 'Editar Perfil da Loja', icon: IconBuilding, permission: 'gerir_servicos' },
            { path: '/manuais', label: 'Manual do Sistema', icon: IconQuestionCircle }
        ]
    }
];

export default function DashboardLayout() {
    // ✅ OBTEMOS O 'user', 'logout' E AS 'permissoes' DO CONTEXTO DE AUTENTICAÇÃO
    const { user, logout, permissoes } = useAuth();
    const empresaLogada = user as Empresa;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // ✅ FUNÇÃO PARA VERIFICAR SE O UTILIZADOR TEM PERMISSÃO
    const hasPermission = (permission?: string) => {
        if (!permission) return true; // Se o link não requer permissão, mostra
        if (permissoes.includes('todas')) return true; // Se for 'empresa', tem acesso a tudo
        return permissoes.includes(permission); // Verifica se a permissão existe no array do funcionário
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const handleCategoryClick = (categoryTitle: string) => {
        if (isDrawerOpen && activeCategory === categoryTitle) {
            setIsDrawerOpen(false);
            setActiveCategory(null);
        } else {
            setIsDrawerOpen(true);
            setActiveCategory(categoryTitle);
        }
    };

    const handleLinkClick = () => {
        setIsDrawerOpen(false);
        setActiveCategory(null);
    };

    return (
        <div className="relative min-h-screen bg-fundo-principal text-texto-principal">
            <div className="flex">
                <aside className="fixed top-0 left-0 h-full bg-fundo-secundario flex z-30">
                    <div className="w-20 flex flex-col items-center py-4 border-r border-borda">
                        <button onClick={() => { setIsDrawerOpen(!isDrawerOpen); setActiveCategory(isDrawerOpen ? null : (activeCategory || navigationStructure[0].title)) }} className="p-2 mb-4 rounded-lg hover:bg-gray-700 text-texto-secundario hover:text-white">
                            <IconBars size={24} />
                        </button>
                        <nav className="flex-1 flex flex-col items-center space-y-4">
                            {navigationStructure.map((category) => {
                                // ✅ Filtra para ver se algum link da categoria é visível
                                const isCategoryVisible = category.links.some(link => hasPermission(link.permission));
                                if (!isCategoryVisible) return null; // Se não houver links visíveis, não mostra o ícone da categoria

                                return (
                                    <button
                                        key={category.title}
                                        onClick={() => handleCategoryClick(category.title)}
                                        className={`p-3 rounded-lg transition-colors group relative ${activeCategory === category.title && isDrawerOpen ? 'bg-primaria-padrao text-white' : 'hover:bg-primaria-intermediario'}`}
                                        title={category.title}
                                    >
                                        <category.icon size={22} />
                                        <span className="absolute left-full ml-4 p-2 w-auto min-w-max rounded-md shadow-md text-white bg-gray-800 text-xs font-bold transition-all opacity-0 group-hover:opacity-100">
                                            {category.title}
                                        </span>
                                    </button>
                                )
                            })}
                        </nav>
                        <div className="mt-auto">
                            <Button onClick={handleLogout} variant="secondary" className="!w-12 !h-12 flex items-center justify-center">
                                <IconSignOutAlt size={20} />
                            </Button>
                        </div>
                    </div>

                    <div className={`h-full bg-fundo-secundario border-r border-borda flex flex-col transition-all duration-300 overflow-hidden ${isDrawerOpen ? 'w-64' : 'w-0'}`}>
                        <div className="p-4 border-b border-borda">
                            <h1 className="text-2xl font-bold text-primaria-padrao">NaniSound</h1>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-bold truncate">{empresaLogada?.nome_empresa}</p>
                            <p className="text-xs text-texto-secundario truncate">{empresaLogada?.email}</p>
                        </div>
                        <nav className="flex-1 overflow-y-auto pt-2">
                            {navigationStructure.map((category) => (
                                <div key={category.title} className={`${activeCategory === category.title ? 'block' : 'hidden'}`}>
                                    <h2 className="px-4 mb-2 text-xs font-bold tracking-wider text-texto-secundario uppercase">
                                        {category.title}
                                    </h2>
                                    <ul className="space-y-1 px-2">
                                        {category.links.map(link => {
                                            // ✅ Apenas renderiza o link se o utilizador tiver permissão
                                            if (!hasPermission(link.permission)) return null;

                                            return (
                                                <li key={link.path}>
                                                    <NavLink
                                                        to={link.path}
                                                        onClick={handleLinkClick}
                                                        className={({ isActive }) => `flex items-center py-2 px-4 rounded-lg transition-colors text-sm font-semibold ${isActive ? 'bg-primaria-padrao text-white' : 'text-texto-secundario hover:bg-primaria-intermediario hover:text-white'}`}
                                                    >
                                                        <link.icon className="h-5 w-5 mr-3" />
                                                        <span>{link.label}</span>
                                                    </NavLink>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main className={`flex-1 p-8 md:p-10 overflow-y-auto transition-all duration-300 ml-20`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}