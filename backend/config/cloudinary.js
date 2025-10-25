const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ofertas',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'limit' }],
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
});

// ✅ Certifique-se que esta função está sendo exportada
const uploadWithErrorHandling = (req, res, next) => {
  upload.single('imagem_caminhao')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
        }
        return res.status(400).json({ error: 'Erro no upload do arquivo' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    next();
  });
};

// ✅ Exportação CORRETA
module.exports = { upload, uploadWithErrorHandling, cloudinary };