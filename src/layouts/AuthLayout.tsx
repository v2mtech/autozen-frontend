import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-auth-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elemento de design (onda) */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-auth-wave transform -skew-y-6 origin-top-left"></div>
      
      {/* REMOVIDA a limitação de largura daqui para dar controlo às páginas filhas */}
      <div className="relative z-10 w-full">
        <Outlet />
      </div>

      <p className="absolute bottom-4 text-xs text-gray-400 z-10">
        Gerencial NANISOUND © By V2M COMMERCIAL AUTOMATION © {new Date().getFullYear()}
      </p>
    </div>
  );
}