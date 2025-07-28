import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={props.id || props.name} className="text-sm font-semibold text-gray-400 block mb-2">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primaria-padrao focus:outline-none transition duration-200"
        {...props}
      />
    </div>
  );
}