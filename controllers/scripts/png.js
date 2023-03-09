const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const path = require('path');

const imagePath = path.join(__dirname, '..', '..', 'images', 'test.png');

// Les métadonnées à ajouter
const metadata = {
  creator: 'John Doe',
  date: new Date().toISOString(),
  description: 'Une belle image'
};

// Fonction asynchrone pour ajouter les métadonnées à l'image
async function addMetadata() {
  try {
    // Démarre le processus ExifTool
    await ep.open();

    // Ajoute les métadonnées à l'image
    await ep.writeMetadata(imagePath, metadata, ['overwrite_original']);

    console.log('Métadonnées ajoutées avec succès:');
    console.log(metadata);

    // Extrait les métadonnées de la nouvelle image
    await extractMetadata();
  } catch (err) {
    console.error(err);
  } finally {
    // Arrête le processus ExifTool
    await ep.close();
  }
}

// Fonction asynchrone pour extraire les métadonnées de la nouvelle image
async function extractMetadata() {
  try {
    // Extrait les métadonnées de l'image
    const extractedMetadata = await ep.readMetadata(imagePath);

    console.log('Métadonnées extraites avec succès:');
    console.log(extractedMetadata.data[0].Description);

    return extractedMetadata; // renvoie les métadonnées extraites
  } catch (err) {
    console.error(err);
  }
}

// Appelle la fonction pour ajouter les métadonnées à l'image
addMetadata();
