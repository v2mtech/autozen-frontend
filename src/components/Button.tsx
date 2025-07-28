import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  // Estilo base comum a todos os botões
  const baseStyle = "w-full font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  
  // Variantes de estilo para o tema claro
  const variants = {
    primary: "bg-primaria-padrao hover:bg-primaria-escuro text-white",
    secondary: "bg-fundo-secundario hover:bg-gray-200 text-texto-principal border border-borda",
    danger: "bg-erro hover:opacity-90 text-white",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}