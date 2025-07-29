import React from 'react';

// ✅ Caminho para a nova imagem na pasta 'public'
const CarImage = '/assets/car-damage-diagram.png';

const CarDiagram = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src={CarImage}
        alt="Diagrama de Avarias do Veículo"
        {...props}
        className="w-full h-auto cursor-pointer bg-white rounded-md"
    />
);

export default CarDiagram;