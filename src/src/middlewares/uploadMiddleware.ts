import multer from 'multer';
import path from 'path';
import fs from 'fs'; 

const uploadDir = 'uploads';

//caminho absoluto para a pasta 'uploads' na raiz do diretório 'backend'
const uploadPath = path.resolve(__dirname, '..', '..', uploadDir);

// Verifica se a pasta de uploads não existe e, em caso afirmativo, cria-a
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // garantindo que o diretório é encontrado
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Garante um nome de ficheiro único para evitar sobreposições
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Não é uma imagem! Por favor, envie apenas imagens.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de 5MB
  },
  fileFilter: fileFilter
});

export default upload;