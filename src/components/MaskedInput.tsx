import React from 'react';
import { IMaskInput } from 'react-imask';

// Interface para as propriedades do componente
interface MaskedInputProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  label: string;
  mask: string;
  [key: string]: any;
}

export const MaskedInput = ({ label, mask, onChange, name, ...props }: MaskedInputProps) => {
  return (
    <div>
      <label htmlFor={props.id || name} className="text-sm font-semibold text-gray-400 block mb-2">
        {label}
      </label>
      <IMaskInput
        mask={mask}
        // Garante que o valor enviado para a lógica do formulário seja apenas os dígitos
        unmask={true} 
        // Esta função é chamada quando o valor do input é aceito pela máscara
        onAccept={(value: any) => {
          const event = {
            target: {
              name: name,
              value: value, 
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(event);
        }}
        // Define o caractere que aparece nos espaços vazios da máscara
        placeholderChar="_"
        {...props}
        // Aplicamos a estilização
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primaria-padrao focus:outline-none transition duration-200"
      />
    </div>
  );
};