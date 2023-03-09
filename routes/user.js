// Importation de la bibliothèque Express
const express = require('express');
// Création d'un routeur pour les jeux
const router = express.Router();
// Importation des contrôleurs pour les utilisateurs
const userCtrl = require('../controllers/user.js');
// Importation du middleware d'authentification
const auth = require('../middleware/auth');

// Définition d'une route pour inscrire un utilisateur
router.post('/signup', userCtrl.signup);
// Définition d'une route pour connecté un utilisateur
router.post('/login', userCtrl.login);
// Définition d'une route pour vérifier un utilisateur
router.get('/verifyToken', userCtrl.verifyToken);

// Définition d'une route pour récupérer un utilisateur
router.get('/getUser', auth, userCtrl.getUser);
// Définition d'une route pour récupérer tous les utilisateurs
router.get('/getAllUsers', auth, userCtrl.getAllUsers);

// Définition d'une route pour mettre a jour le joueur et le jeu lorsqu'il trouve un qrcode
router.put('/updateUserGameInfo', auth, userCtrl.updateUserGameInfo);

// Exportation du routeur pour les utilisateurs
module.exports = router;
