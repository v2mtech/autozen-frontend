import React from 'react';
import { Link } from 'react-router-dom';
import { FaStore, FaUser } from 'react-icons/fa';

// --- INÍCIO DA CORREÇÃO ---
// 1. Forçamos a tipagem dos ícones para serem reconhecidos como componentes válidos.
const StoreIcon = FaStore as React.ElementType;
const UserIcon = FaUser as React.ElementType;
// --- FIM DA CORREÇÃO ---

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto bg-auth-card rounded-2xl shadow-xl p-8 animate-fade-in-up">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-auth-text-dark mb-2">Bem-vindo!</h1>
        <p className="text-auth-text-light text-md mb-8">Selecione o seu tipo de acesso para começar.</p>
        <div className="space-y-4">
          <Link
            to="/login/empresa"
            className="group flex items-center justify-center w-full text-center bg-auth-button hover:bg-auth-button-hover text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
          >
            {/* 2. Usamos as novas variáveis com a tipagem correta */}
            <StoreIcon className="mr-3 transition-transform group-hover:rotate-[-10deg]" />
            Sou uma Loja
          </Link>
          <Link
            to="/login/usuario"
            className="group flex items-center justify-center w-full text-center bg-auth-button hover:bg-auth-button-hover text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
          >
            {/* 3. Usamos as novas variáveis com a tipagem correta */}
            <UserIcon className="mr-3 transition-transform group-hover:rotate-[-10deg]" />
            Sou um Cliente
          </Link>
        </div>
      </div>
    </div>
  );
}