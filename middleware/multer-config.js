// Importation du module multer
const multer = require('multer');

// Définition des types de fichiers autorisés
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

// Configuration de l'enregistrement des fichiers sur le disque
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // Spécification du répertoire de destination pour les images
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    // Définition du nom du fichier en enlevant les espaces et en ajoutant un horodatage
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

// Exportation de la configuration multer pour l'enregistrement des fichiers
module.exports = multer({storage: storage}).single('image');
