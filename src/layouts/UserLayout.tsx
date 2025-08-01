import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import {
    FaStore, FaFileSignature, FaClipboardList, FaTicketAlt, FaUserCircle,
    FaSignOutAlt, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaBars
} from 'react-icons/fa';

// --- Tipagem dos Ícones ---
const IconStore = FaStore as React.ElementType;
const IconFileSignature = FaFileSignature as React.ElementType;
const IconClipboardList = FaClipboardList as React.ElementType;
const IconTicketAlt = FaTicketAlt as React.ElementType;
const IconUserCircle = FaUserCircle as React.ElementType;
const IconSignOutAlt = FaSignOutAlt as React.ElementType;
const IconCalendarAlt = FaCalendarAlt as React.ElementType;
const IconBars = FaBars as React.ElementType;

interface User {
    nome: string;
    email: string;
}

interface NavItem {
    path: string;
    label: string;
    icon: React.ElementType;
}

interface NavCategory {
    title: string;
    icon: React.ElementType;
    links: NavItem[];
}

const navigationStructure: NavCategory[] = [
    {
        title: 'LOJAS',
        icon: IconStore,
        links: [
            { path: '/home-usuario', label: 'Lojas Disponíveis', icon: IconStore },
        ]
    },
    {
        title: 'MEUS ORÇAMENTOS',
        icon: IconFileSignature,
        links: [
            { path: '/meus-orcamentos', label: 'Orçamentos Realizados', icon: IconFileSignature },
            { path: '/minhas-ordens-de-servico', label: 'Ordens de Serviço', icon: IconClipboardList },
        ]
    },
    {
        title: 'MEUS AGENDAMENTOS',
        icon: IconCalendarAlt,
        links: [
            { path: '/meus-agendamentos', label: 'Serviços Agendados', icon: IconCalendarAlt },
        ]
    },
    {
        title: 'MINHA CONTA',
        icon: IconUserCircle,
        links: [
            { path: '/meus-vouchers', label: 'Meus Vouchers', icon: IconTicketAlt },
            { path: '/editar-usuario', label: 'Meu Perfil', icon: IconUserCircle },
        ]
    }
];

export default function UserLayout() {
    const { user, logout } = useAuth();
    const userName = (user as User)?.nome || 'Cliente';
    const userEmail = (user as User)?.email || '';
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
                            {navigationStructure.map((category) => (
                                <button
                                    key={category.title}
                                    onClick={() => handleCategoryClick(category.title)}
                                    className={`p-3 rounded-lg transition-colors group relative ${activeCategory === category.title && isDrawerOpen ? 'bg-primaria-padrao text-white' : 'hover:bg-primaria-intermediario'}`}
                                    title={category.title}
                                >
                                    <category.icon size={22} />
                                </button>
                            ))}
                        </nav>
                        <div className="mt-auto">
                            <Button onClick={logout} variant="secondary" className="!w-12 !h-12 flex items-center justify-center">
                                <IconSignOutAlt size={20} />
                            </Button>
                        </div>
                    </div>

                    <div className={`h-full bg-fundo-secundario border-r border-borda flex flex-col transition-all duration-300 overflow-hidden ${isDrawerOpen ? 'w-64' : 'w-0'}`}>
                        <div className="p-4 border-b border-borda h-[65px] flex items-center">
                            <img src="/assets/logo.png" alt="Vértice Auto Logo" className="w-32 h-auto" />
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-bold truncate text-texto-principal">{userName}</p>
                            <p className="text-xs text-texto-secundario truncate">{userEmail}</p>
                        </div>
                        <nav className="flex-1 overflow-y-auto pt-2">
                            {navigationStructure.map((category) => (
                                <div key={category.title} className={`${activeCategory === category.title ? 'block' : 'hidden'}`}>
                                    <h2 className="px-4 mb-2 text-xs font-bold tracking-wider text-texto-secundario uppercase">
                                        {category.title}
                                    </h2>
                                    <ul className="space-y-1 px-2">
                                        {category.links.map(link => (
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
                                        ))}
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