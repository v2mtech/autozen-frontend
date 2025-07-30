import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-auth-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-auth-wave transform -skew-y-6 origin-top-left"></div>

      <div className="relative z-10 w-full flex justify-center">
        <Outlet />
      </div>

      <p className="absolute bottom-4 text-xs text-texto-secundario z-10">
        Vértice Auto © By V2M Tech © {new Date().getFullYear()}
      </p>
    </div>
  );
}