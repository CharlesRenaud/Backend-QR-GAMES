const Game = require('../models/game');
const User = require('../models/user');
const fs = require('fs');
const MayaQrGenerator = require("./scripts/MayaQrGenerator")
const path = require('path');
const JSZip = require('jszip');
const { Buffer } = require('buffer');
const { file } = require('jszip');

// Importation de l'UUID pour générer des identifiants uniques pour les images
// const { v4: uuidv4 } = require('uuid');

// Fonction pour créer un nouveau jeu
exports.createGame = (req, res, next) => {
    console.log('Received request to create a new game');
    // Récupération des informations du jeu à partir de la requête
    const gameObject = req.body;
    console.log('Uploaded file:', req.file);
    console.log('Game information:', req.body);
    // Suppression de l'identifiant du jeu
    delete gameObject._id;
    let imageUrl;
    // Si un fichier image est inclus dans la requête, on génère un URL pour cette image
    if (req.file) {
        console.log('Fichier image trouvé dans la requete');
        // Génération de l'identifiant unique pour l'image
        // const imageUUID = uuidv4();
        /*const imageName = `${imageUUID}_${req.file.originalname}`;*/
        imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.originalname}`;
        console.log('Image URL:', imageUrl);
    }
    // Ajout de l'identifiant de l'utilisateur
    gameObject.userId = req.auth.userId;
    // Création d'un objet de jeu avec les informations récupérées
    const game = new Game({
        ...gameObject,
        imageUrl
    });
    console.log('Enregistrement du jeu dans la base de données:', game);
    // Enregistrement du jeu dans la base de données
    if (game.scriptLinked === "MayaQrGenerator") {
        console.log(game.scriptLinked)
        // Génération des QR codes pour ce jeu
        MayaQrGenerator(game._id, gameObject.scriptLinked);
        // Construction du tableau d'URLs vers les images QR
        for (let i = 1; i <= 4; i++) {
            game.qrImages.push(`${req.protocol}://jeuqr.fr//images/${game._id}/qr-${i}.svg`);
        }
        game.qrImages.push(`${req.protocol}://jeuqr.fr//images/${game._id}/qr-affiche-1.svg`);
        game.qrImages.push(`${req.protocol}://jeuqr.fr//images/${game._id}/qr-affiche-2.svg`);
        game.qrImages.push(`${req.protocol}://jeuqr.fr//images/${game._id}/qr-flyers.svg`);
    }
    game.save()
        .then(() => {
            console.log('Jeu enregistré avec succès');
            res.status(201).json({ message: 'Jeu enregistré' });
        })
        .catch(error => {
            console.error("Erreur lors de l'enregistrement du jeu:", error);
            res.status(400).json({ error });
        });
};

// Fonction pour modifier un jeu existant
exports.modifyGames = (req, res, next) => {
    console.log('Requête reçue pour modifier un jeu');
    let gameObject = { ...req.body };
    if (req.file) {
        gameObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    }
    // Suppression de l'identifiant de l'utilisateur
    delete gameObject._userId;
    console.log('gameObject: ', gameObject);
    // Recherche du jeu correspondant à l'identifiant fourni
    console.log(req.params.id)
    Game.findOne({ _id: req.params.id })
        .then((game) => {
            console.log('Jeu trouvé : ', game);
            // Vérification de l'autorisation de l'utilisateur
            if (!req.auth.userId) {
                console.error("L'identifiant de l'utilisateur n'est pas défini");
                res.status(400).json({ message: "L'identifiant de l'utilisateur n'est pas défini" });
            } else if ((game.userId !== req.auth.userId) && (req.auth.isAdmin === false)) {
                console.error("Accès non autorisé : l'identifiant de l'utilisateur dans la requête", req.auth.userId, "ne correspond pas à l'identifiant de l'utilisateur du jeu", game.userId);
                res.status(401).json({ message: 'Accès non autorisé' });
            } else {
                Game.updateOne({ _id: req.params.id }, { ...gameObject, _id: req.params.id })
                    .then(() => {
                        console.log('Jeu mis à jour avec succès');
                        res.status(200).json({ message: 'Objet modifié !' });
                    })
                    .catch((error) => {
                        console.error('Erreur lors de la mise à jour du jeu : ', error);
                        res.status(400).json({ error });
                    });
            }

        })
        .catch((error) => {
            console.error('Erreur lors de la recherche du jeu : ', error);
            res.status(400).json({ error });
        });
};



// Suppression d'un jeu
exports.deleteGame = (req, res, next) => {
    Game.findOne({ _id: req.params.id })
        .then(game => {
            if (game.imageUrl) {
                const filename = game.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Game.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: "Jeu supprimé" }))
                        .catch((error) => res.status(400).json({ error }));
                });
            } else if (game.qrImages) {
                fs.rmdir(`images/${req.params.id}`, { recursive: true }, (error) => {
                    if (error) return res.status(500).json({ error });
                    Game.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: "Dossier d'images QR supprimé" }))
                        .catch((error) => res.status(400).json({ error }));
                });
            }
            else {
                Game.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: "Jeu supprimé" }))
                    .catch((error) => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error }));
};

// Récupération d'un jeu unique
exports.getOneGame = (req, res, next) => {
    // Recherche du jeu par son identifiant (ID)
    Game.findOne({ _id: req.params.id })
        .then(game => res.status(200).json(game))
        .catch(error => res.status(404).json({ error }));
};

// Récupération de tous les jeux
exports.getAllGames = (req, res, next) => {
    // Recherche de tous les jeux dans la base de données
    Game.find()
        .then(games => res.status(200).json(games))
        .catch(error => res.status(400).json({ error }));
};

exports.getZip = (req, res, next) => {
    const gameId = req.params.gameId;
    const mediaId = req.params.mediaId;
    const filePath = path.resolve(__dirname, '../images', gameId, `${mediaId}.zip`);
    console.log(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Une erreur est survenue lors du téléchargement du fichier');
        } else {
            const zip = new JSZip();
            zip.loadAsync(data).then(() => {
                zip.generateAsync({ type: 'nodebuffer' }).then((buffer) => {
                    res.set({
                        'Content-Type': 'application/zip',
                        'Content-Disposition': `attachment; filename="${mediaId}.zip"`
                    });
                    console.log(buffer);
                    res.send(buffer);
                });
            });
        }
    });
};


// Récupération d'un gagnant parmi les joueurs ayant terminé le jeu
exports.getOneRandomWinner = (req, res, next) => {
    // Recherche du jeu par son identifiant (ID)
    Game.findOne({ _id: req.params.gameId })
        .populate('playersTermines')
        .then(game => {
            // Tirage aléatoire d'un joueur parmi les joueurs ayant terminé le jeu
            const winner = game.playersTermines[Math.floor(Math.random() * game.playersTermines.length)];

            // Vérification si l'id du gagnant est différent de l'id précédent dans le tableau playersRandomWinner
            const lastWinnerId = game.playersRandomWinner.length > 0 ? game.playersRandomWinner[game.playersRandomWinner.length - 1].toString() : null;
            if (lastWinnerId !== winner._id.toString()) {
                // Ajout de l'id du gagnant à la liste des joueurs tirés au sort
                const options = {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    timeZone: 'Europe/Paris'
                };

                const formatter = new Intl.DateTimeFormat('fr-FR', options);

                game.playersRandomWinner.push({ id: winner._id, date: formatter.format(new Date()) });
            }

            // Enregistrement des modifications dans la base de données
            game.save()
                .then(() => {
                    // Récupération des objets utilisateur des gagnants
                    const winners = game.playersRandomWinner.map(async player => {
                        const user = await User.findById(player.id);
                        return user;
                    });

                    // Envoi de la réponse avec les objets utilisateur des gagnants
                    Promise.all(winners)
                        .then(winnersData => {
                            res.status(200).json({ winners: winnersData, playersRandomWinner: game.playersRandomWinner });
                        })
                        .catch(error => res.status(500).json({ error }));
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(404).json({ error }));
};


