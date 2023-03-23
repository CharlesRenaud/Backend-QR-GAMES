// Importation du module Mongoose pour la connexion à la base de données MongoDB
const mongoose = require('mongoose');

// Importation du module mongoose-unique-validator pour vérifier la unicité des emails dans la base de données
const uniqueValidator = require('mongoose-unique-validator');

// Définition du schéma pour les utilisateurs
const userSchema = mongoose.Schema({
  // L'email est requis et unique
  email: { type: String, required: true, unique: true },
  // Le mot de passe est requis
  password: { type: String, required: true },
  // Le statut administrateur est défini par défaut à false
  isAdmin: { type: Boolean, default: false },
  // La liste des jeux auxquels l'utilisateur est inscrit
  games: {
    [String]: {
        qrcodesFind: [{ type: String }],
        playerAdvancement: { type: Boolean }
      }
  } 
});

// Application du plugin de vérification de unicité à notre schéma
userSchema.plugin(uniqueValidator);

// Exportation du modèle "User" basé sur notre schéma
module.exports = mongoose.model('User', userSchema);
