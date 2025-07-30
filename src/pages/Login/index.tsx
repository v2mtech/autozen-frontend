import React from 'react';
import { Link } from 'react-router-dom';
import { FaStore, FaUser } from 'react-icons/fa';

const StoreIcon = FaStore as React.ElementType;
const UserIcon = FaUser as React.ElementType;

export default function LoginPage() {
  return (
    // ✅ CORREÇÃO: Padding superior (pt) foi reduzido de p-8 para pt-6 para diminuir o espaço no topo.
    <div className="w-full max-w-md mx-auto bg-auth-card rounded-2xl shadow-xl px-8 pt-6 pb-8 animate-fade-in-up">
      <div className="text-center">

        <img src="/assets/logo.png"
          alt="Vértice Auto Logo"
          // ✅ CORREÇÃO: className reativada e margem inferior (mb) ajustada para controlar o espaço abaixo.
          className="w-56 h-auto mx-auto mb-4"
        />

        <h1 className="text-2xl font-bold text-auth-text-dark mb-2"></h1>

        <p className="text-auth-text-light text-md mb-8">Selecione o seu tipo de acesso para começar.</p>
        <div className="space-y-4">
          <Link
            to="/login/empresa"
            className="group flex items-center justify-center w-full text-center bg-auth-button hover:bg-auth-button-hover text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
          >
            <StoreIcon className="mr-3 transition-transform group-hover:rotate[-10deg]" />
            Sou uma Loja
          </Link>
          <Link
            to="/login/usuario"
            className="group flex items-center justify-center w-full text-center bg-auth-button hover:bg-auth-button-hover text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
          >
            <UserIcon className="mr-3 transition-transform group-hover:rotate[-10deg]" />
            Sou um Cliente
          </Link>
        </div>
      </div>
    </div>
  );
}