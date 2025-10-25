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

// ✅ Exportação CORRETA
module.exports = { upload, cloudinary };