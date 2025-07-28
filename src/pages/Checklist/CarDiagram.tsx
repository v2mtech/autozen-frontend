import React from 'react';

// O caminho para a imagem na pasta 'public'
const CarImage = '/assets/car-top-view.svg';

const CarDiagram = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src={CarImage}
        alt="Diagrama do Veículo"
        {...props}
        className="w-full h-auto cursor-pointer bg-gray-200 rounded-md p-4"
    />
);

export default CarDiagram;