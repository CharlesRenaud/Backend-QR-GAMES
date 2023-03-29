// Importation de la bibliothèque Express
const express = require('express');
// Création d'un routeur pour les jeux
const router = express.Router();
// Importation du middleware d'authentification
const auth = require('../middleware/auth');
// Importation du middleware de configuration Multer pour les téléchargements de fichiers
const multer = require('../middleware/multer-config');
// Importation des contrôleurs pour les jeux
const gameCtrl = require('../controllers/game');

// Définition d'une route pour obtenir tous les jeux
router.get('/', auth, gameCtrl.getAllGames);
// Définition d'une route pour créer un jeu
router.post('/', auth, multer, gameCtrl.createGame);
// Définition d'une route pour obtenir un jeu spécifique
router.get('/:id', gameCtrl.getOneGame);
// Définition d'une route pour modifier un jeu
router.put('/:id', auth, multer, gameCtrl.modifyGames);
// Définition d'une route pour supprimer un jeu
router.delete('/:id', auth, gameCtrl.deleteGame);

router.get('/:gameId/:mediaId', auth, gameCtrl.getZip);

router.get('/:gameId/random/winner', gameCtrl.getOneRandomWinner);


// Exportation du routeur pour les jeux
module.exports = router;