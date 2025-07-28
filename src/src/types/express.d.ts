// Define a estrutura do que o seu token JWT contém
interface TokenPayload {
    id: number;
    email: string;
    type: 'usuario' | 'empresa';
}

// Sobrescreve a definição global do Request do Express
declare namespace Express {
    export interface Request {
        // Adiciona as novas propriedades como opcionais
        usuario?: TokenPayload;
        empresa?: TokenPayload;
    }
}