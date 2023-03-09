const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Inscription d'un nouvel utilisateur
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10) // hashage du mot de passe
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash,
                isAdmin: false
            });
            user.save() // sauvegarde de l'utilisateur dans la base de données
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

// Connexion d'un utilisateur existant
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }) // Recherche de l'utilisateur par email
        .then(user => {
            if (!user) { // Si l'utilisateur n'existe pas
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password) // comparaison du mot de passe hashé avec celui envoyé
                .then(valid => {
                    if (!valid) { // si les mots de passe ne correspondent pas
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign( // génération d'un token d'authentification
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

// Vérification du token d'authentification
exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'RANDOM_TOKEN_SECRET'); // vérification du token
        req.userData = { userId: decoded.userId };
        res.status(200).json({
            message: 'Token valide'
        });
    } catch (error) { // si le token n'est pas valide
        return res.status(401).json({ error: 'Token non valide' });
    }
};

// Récupère un utilisateur en fonction de son identifiant
exports.getUser = (req, res, next) => {
    User.findById(req.auth.userId)
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            res.status(200).json({
                user: {
                    _id: user._id,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        })
        .catch(error => res.status(500).json({ error }));
};

// Récupère tous les utilisateurs
exports.getAllUsers = (req, res, next) => {
    User.find()
        .then(users => {
            res.status(200).json({
                users: users.map(user => {
                    return {
                        _id: user._id,
                        email: user.email,
                        isAdmin: user.isAdmin
                    };
                })
            });
        })
        .catch(error => res.status(500).json({ error }));
};

// Met à jour les informations d'un utilisateur pour un jeu donné
exports.updateUserGameInfo = (req, res, next) => {
    const userId = req.params.userId;
    const gameId = req.params.gameId;
    const qrcode = req.body.qrcode;

    User.findById(userId) // Recherche de l'utilisateur par son identifiant
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé !' });
            }
            // Recherche du jeu correspondant dans la liste des jeux de l'utilisateur
            const gameIndex = user.games.findIndex(game => game.id.toString() === gameId);
            if (gameIndex === -1) {
                // Si le jeu n'existe pas encore dans la liste des jeux de l'utilisateur, on le crée
                const newGame = {
                    id: gameId,
                    qrcodesFind: [qrcode],
                    playerAdvancement: false // on met l'avancement à false car il faut au moins 2 QR codes pour compléter le jeu
                };
                user.games.push(newGame);
            } else {
                // Si le jeu existe déjà dans la liste des jeux de l'utilisateur
                // Vérification si le qrcode existe déjà dans la liste des qrcodes trouvés pour le jeu donné
                if (user.games[gameIndex].qrcodesFind.includes(qrcode)) {
                    return res.status(400).json({ error: 'QR code déjà trouvé pour ce jeu !' });
                }
                // Ajout du nouveau qrcode dans la liste des qrcodes trouvés pour le jeu donné
                user.games[gameIndex].qrcodesFind.push(qrcode);
                // Mise à jour de l'avancement de l'utilisateur pour le jeu donné
                const nbQrCodes = user.games[gameIndex].id.nbQrCodes;
                const nbQrCodesFound = user.games[gameIndex].qrcodesFind.length;
                const isGameCompleted = nbQrCodesFound === nbQrCodes;
                user.games[gameIndex].playerAdvancement = isGameCompleted;
                // Si le jeu est complété, on l'ajoute à la liste des jeux terminés pour l'utilisateur
                if (isGameCompleted) {
                    Game.findByIdAndUpdate(gameId, { $push: { playersTermines: user._id } })
                        .then(() => {
                            // Mise à jour des informations de l'utilisateur dans la liste des joueurs pour le jeu donné
                            const playerIndex = req.game.players.findIndex(player => player.id.toString() === user._id.toString());
                            if (playerIndex === -1) {
                                // Si l'utilisateur n'existe pas encore dans la liste des joueurs pour le jeu donné, on l'ajoute
                                const newPlayer = {
                                    id: user._id,
                                    qrcodesFind: user.games[gameIndex].qrcodesFind
                                };
                                req.game.players.push(newPlayer);
                            } else {
                                // Si l'utilisateur existe déjà dans la liste des joueurs pour le jeu donné, on met à jour sa liste de QR codes trouvés
                                req.game.players[playerIndex].qrcodesFind = user.games[gameIndex].qrcodesFind;
                            }
                            req.game.save() // sauvegarde du jeu mis à jour dans la base de données
                                .then(() => res.status(200).json({
                                    message: 'Informations utilisateur mises à jour avec succès !'
                                }))
                                .catch(error => res.status(500).json({ error }));
                        })
                        .catch(error => res.status(500).json({ error }));
                } else {
                    // Si le jeu n'est pas complété, on met à jour uniquement les informations de l'utilisateur
                    Game.findById(gameId)
                        .then(game => {
                            // Recherche de l'utilisateur dans la liste des joueurs pour le jeu donné
                            const playerIndex = game.players.findIndex(player => player.id.toString() === user._id.toString());
                            if (playerIndex === -1) {
                                // Si l'utilisateur n'existe pas encore dans la liste des joueurs pour le jeu donné, on l'ajoute
                                const newPlayer = {
                                    id: user._id,
                                    qrcodesFind: user.games[gameIndex].qrcodesFind
                                };
                                game.players.push(newPlayer);
                            } else {
                                // Si l'utilisateur existe déjà dans la liste des joueurs pour le jeu donné, on met à jour sa liste de QR codes trouvés
                                game.players[playerIndex].qrcodesFind = user.games[gameIndex].qrcodesFind;
                            }
                            game.save() // sauvegarde du jeu mis à jour dans la base de données
                                .then(() => res.status(200).json({
                                    message: 'Informations utilisateur mises à jour avec succès !'
                                }))
                                .catch(error => res.status(500).json({ error }));
                        })
                        .catch(error => res.status(500).json({ error }));
                }
            }
            // Sauvegarde des modifications de l'utilisateur dans la base de données
            user.save()
                .then(() => { })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

