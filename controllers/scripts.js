const fs = require('fs');
const path = require('path');

// Retourner la liste des scripts disponbles, utile pour les listés sur l'admin panel
exports.listScripts = (req, res, next) => {
    const scriptDir = path.resolve(__dirname, 'scripts');
  fs.readdir(scriptDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: "Une erreur s'est produite lors de la récupération de la liste des scripts." });
    }
    const scriptNames = files.map(file => file.split('.')[0]);
    return res.status(200).json(scriptNames);
  });
}
