const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de uploads existe
const uploadDir = 'uploads/ofertas';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `oferta-${uniqueSuffix}${extension}`);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  }
});

// Middleware para uma única imagem
const uploadSingle = upload.single('imagem_caminhao');

// Middleware com tratamento de erro
const uploadWithErrorHandling = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'Arquivo muito grande. Tamanho máximo: 5MB' 
        });
      }
      return res.status(400).json({ 
        message: 'Erro no upload: ' + err.message 
      });
    } else if (err) {
      return res.status(400).json({ 
        message: err.message 
      });
    }
    next();
  });
};

// Função para deletar arquivo
const deleteFile = (filename) => {
  if (filename) {
    const filePath = path.join(uploadDir, filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Erro ao deletar arquivo:', err);
      } else {
        console.log('Arquivo deletado:', filename);
      }
    });
  }
};

module.exports = {
  uploadWithErrorHandling,
  deleteFile
};