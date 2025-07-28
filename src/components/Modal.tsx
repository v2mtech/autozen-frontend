import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidthClass = 'max-w-2xl' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        // A nova propriedade é usada aqui para definir a largura
        className={`bg-fundo-principal rounded-lg shadow-xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col border border-borda`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-borda">
          <h2 className="text-xl font-bold text-texto-principal">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-erro text-2xl font-bold">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}