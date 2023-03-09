// Importation de la bibliothèque Mongoose pour travailler avec la base de données MongoDB
const mongoose = require('mongoose');

// Importation d'un module pour valider l'unicité des valeurs dans la base de données
const uniqueValidator = require('mongoose-unique-validator');

// Définition du schéma de données pour les jeux
const gameSchema = mongoose.Schema({
  name: { 
    type: String, // Le nom du jeu sera une chaîne de caractères
    required: true, // Le nom du jeu est obligatoire
    unique: true // Le nom du jeu doit être unique
  },
  qrNumber: { 
    type: Number
  },
  startDate : {
    type: Date, // La date de fin sera de type date
    required: true // La date de fin est obligatoire
  },
  endDate: { 
    type: Date, // La date de fin sera de type date
    required: true // La date de fin est obligatoire
  },
  imageUrl: { 
    type: String // L'URL de l'image sera une chaîne de caractères
  },
  userId: {
    type:String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  scriptLinked: {
    type: String,
    required: true
  },
  reward : {
    type: String,
    required: true
  },
  customer: {
    type: String,
    required: true
  },
  contactCustomer: {
    type: String,
    required: true
  },
  qrImages: {
    type: Array
  },
  players: [{
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    qrcodesFind: [{ type: String }],
  }],
  playersTermines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Application du plugin pour valider l'unicité des valeurs
gameSchema.plugin(uniqueValidator);

// Exportation du modèle de jeu pour être utilisé dans d'autres fichiers
module.exports = mongoose.model('Game', gameSchema);
