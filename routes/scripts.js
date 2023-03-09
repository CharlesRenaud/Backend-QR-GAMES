// Importation de la bibliothèque Express
const express = require('express');
const auth = require('../middleware/auth');
// Création d'un routeur pour les jeux
const router = express.Router();
const scriptsCtrl = require('../controllers/scripts');


// Définition d'une route pour inscrire un utilisateur
router.get('/list-script', auth, scriptsCtrl.listScripts);

module.exports = router;