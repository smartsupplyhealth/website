const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s’il n’existe pas
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Exemple: produit-1631231231231.jpg
    const ext = path.extname(file.originalname);
    cb(null, 'produit-' + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
      cb(null, true);
    } else {
      cb(new Error('Seulement les images sont autorisées'));
    }
  }
});

module.exports = upload;
