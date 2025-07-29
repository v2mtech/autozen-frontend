import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={props.id || props.name} className="text-sm font-semibold text-texto-secundario block mb-2">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-3 bg-white border border-borda text-texto-principal rounded-lg focus:ring-2 focus:ring-primaria-escuro focus:outline-none transition duration-200 disabled:bg-gray-100"
        {...props}
      />
    </div>
  );
}