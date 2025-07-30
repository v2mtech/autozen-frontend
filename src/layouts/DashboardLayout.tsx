import React, { useState } from 'react';
// ✅ 1. Importar o hook useNavigate
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import {
    FaTachometerAlt, FaClipboardList, FaFileSignature, FaCalendarAlt, FaBoxOpen, FaCogs,
    FaTags, FaWarehouse, FaExchangeAlt, FaTruck, FaChartPie, FaUserTie, FaPercentage,
    FaChartLine, FaFileInvoiceDollar, FaMoneyBillWave, FaFileAlt, FaGift, FaBalanceScale,
    FaFileInvoice, FaUsers, FaStar, FaVideo, FaBuilding, FaSignOutAlt, FaBars, FaBrain,
    FaHistory, FaKey, FaQuestionCircle, FaFileUpload
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
const IconSignOutAlt = FaSignOutAlt as React.ElementType;
const IconBars = FaBars as React.ElementType;
const IconBrain = FaBrain as React.ElementType;
const IconHistory = FaHistory as React.ElementType;
const IconKey = FaKey as React.ElementType;
const IconQuestionCircle = FaQuestionCircle as React.ElementType;
const IconFileUpload = FaFileUpload as React.ElementType;

interface Empresa {
    id: string;
    nome_empresa: string;
    email: string;
}

interface NavItem {
    path: string;
    label: string;
    icon: React.ElementType;
    permission?: string;
}

interface NavCategory {
    title: string;
    icon: React.ElementType;
    links: NavItem[];
}

const navigationStructure: NavCategory[] = [
    {
        title: 'GESTÃO', icon: IconTachometer,
        links: [
            { path: '/dashboard', label: 'Início', icon: IconTachometer, permission: 'ver_dashboard' },
            { path: '/kanban', label: 'Quadro OS', icon: IconClipboardList, permission: 'ver_quadro_os' },
            { path: '/orcamentos-kanban', label: 'Orçamentos Kanban', icon: IconFileSignature, permission: 'ver_orcamentos' },
            { path: '/agenda', label: 'Agenda', icon: IconCalendarAlt, permission: 'ver_agenda' },
            { path: '/historico-cliente', label: 'Histórico de Clientes', icon: IconUsers, permission: 'ver_dashboard' },
        ]
    },
    {
        title: 'PRODUTOS E ESTOQUE', icon: IconWarehouse,
        links: [
            { path: '/produtos', label: 'Produtos', icon: IconTags, permission: 'gerir_produtos' },
            { path: '/entrada-nota', label: 'Entrada por XML', icon: IconFileUpload, permission: 'gerir_produtos' },
            { path: '/estoque', label: 'Estoque', icon: IconWarehouse, permission: 'gerir_produtos' },
            { path: '/fechamento-estoque', label: 'Fechamento de Estoque', icon: IconExchangeAlt, permission: 'gerir_produtos' },
            { path: '/fornecedores', label: 'Fornecedores', icon: IconTruck, permission: 'gerir_fornecedores' },
        ]
    },
    {
        title: 'FINANCEIRO', icon: IconFileInvoiceDollar,
        links: [
            { path: '/faturamento', label: 'Faturamento', icon: IconFileInvoiceDollar, permission: 'ver_relatorios_financeiros' },
            { path: '/dre', label: 'DRE (Resultado)', icon: IconBalanceScale, permission: 'ver_relatorios_financeiros' },
            { path: '/contas-a-pagar', label: 'Contas a Pagar', icon: IconMoneyBillWave, permission: 'gerir_contas' },
            { path: '/contas-a-receber', label: 'Contas a Receber', icon: IconMoneyBillWave, permission: 'gerir_contas' },
        ]
    },
    {
        title: 'CONFIGURAÇÕES', icon: IconCogs,
        links: [
            { path: '/editar-empresa', label: 'Perfil da Loja', icon: IconBuilding, permission: 'gerir_funcionarios' },
            { path: '/funcionarios', label: 'Funcionários', icon: IconUserTie, permission: 'gerir_funcionarios' },
            { path: '/perfis-funcionarios', label: 'Perfis de Acesso', icon: IconKey, permission: 'gerir_funcionarios' },
            { path: '/manuais', label: 'Manual do Sistema', icon: IconQuestionCircle }
        ]
    }
];

export default function DashboardLayout() {
    const { user, logout, permissoes } = useAuth();
    const empresaLogada = user as unknown as Empresa;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // ✅ 2. Criar a função navigate a partir do hook
    const navigate = useNavigate();

    const hasPermission = (permission?: string) => {
        if (!permission) return true;
        if (permissoes.includes('todas')) return true;
        return permissoes.includes(permission);
    };

    const handleLogout = () => {
        logout();
        // ✅ 3. Agora o 'navigate' existe e funciona
        navigate('/login');
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
                <aside className="fixed top-0 left-0 h-full bg-fundo-secundario flex z-30 shadow-lg">
                    <div className="w-20 flex flex-col items-center py-4 border-r border-borda">
                        <button onClick={() => { setIsDrawerOpen(!isDrawerOpen); setActiveCategory(isDrawerOpen ? null : (activeCategory || navigationStructure[0].title)) }} className="p-2 mb-4 rounded-lg hover:bg-fundo-principal text-texto-secundario hover:text-primaria-padrao">
                            <IconBars size={24} />
                        </button>
                        <nav className="flex-1 flex flex-col items-center space-y-4">
                            {navigationStructure.map((category) => {
                                const isCategoryVisible = category.links.some(link => hasPermission(link.permission));
                                if (!isCategoryVisible) return null;
                                return (
                                    <button
                                        key={category.title}
                                        onClick={() => handleCategoryClick(category.title)}
                                        className={`p-3 rounded-lg transition-colors group relative ${activeCategory === category.title && isDrawerOpen ? 'bg-primaria-padrao text-white' : 'hover:bg-primaria-intermediario'}`}
                                        title={category.title}
                                    >
                                        <category.icon size={22} />
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
                        <div className="p-4 border-b border-borda h-[65px] flex items-center">
                            <img src="/assets/logo.png" alt="Vértice Auto Logo" className="w-32 h-auto" />
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-bold truncate text-texto-principal">{empresaLogada?.nome_empresa}</p>
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
                                            if (!hasPermission(link.permission)) return null;
                                            return (
                                                <li key={link.path}>
                                                    <NavLink
                                                        to={link.path}
                                                        onClick={handleLinkClick}
                                                        className={({ isActive }) => `flex items-center py-2 px-4 rounded-lg transition-colors text-sm font-semibold ${isActive ? 'bg-primaria-padrao text-white' : 'text-texto-secundario hover:bg-primaria-intermediario hover:text-texto-principal'}`}
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