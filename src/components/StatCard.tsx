import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode; 
  colorClass: string; // ex: 'text-primaria-claro'
}

export function StatCard({ title, value, icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-fundo-secundario p-6 rounded-lg flex items-center gap-6 shadow-lg">
      <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-700 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}