import React from 'react';
import { IMaskInput } from 'react-imask';

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
      <label htmlFor={props.id || name} className="text-sm font-semibold text-texto-secundario block mb-2">
        {label}
      </label>
      <IMaskInput
        mask={mask}
        unmask={true}
        onAccept={(value: any) => {
          const event = {
            target: {
              name: name,
              value: value,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(event);
        }}
        placeholderChar="_"
        {...props}
        className="w-full px-4 py-3 bg-white border border-borda text-texto-principal rounded-lg focus:ring-2 focus:ring-primaria-escuro focus:outline-none transition duration-200"
      />
    </div>
  );
};