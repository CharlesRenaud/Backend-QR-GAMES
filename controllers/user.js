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
        // Récupération des informations de l'utilisateur
        User.findById(req.userData.userId)
            .then(user => {
                if (!user) {
                    return res.status(401).json({ error: 'Utilisateur non trouvé !' });
                }
                // Envoi des informations de l'utilisateur en plus de la validation du token
                res.status(200).json({
                    message: 'Token valide',
                    user: {
                        _id: user._id,
                        email: user.email,
                        isAdmin: user.isAdmin,
                        games: user.games
                    }
                });
            })
            .catch(error => res.status(500).json({ error }));
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
                    isAdmin: user.isAdmin,
                    games: user.games
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
                        isAdmin: user.isAdmin,
                        games: user.games
                    };
                })
            });
        })
        .catch(error => res.status(500).json({ error }));
};



// Met à jour les informations d'un utilisateur pour un jeu donné
exports.updateUserGameInfo = async (req, res, next) => {
    try {
        // Récupération des paramètres et du corps de la requête
        const { gameId, userId, qrCode } = req.body;

        console.log(gameId, userId, qrCode)

        // Recherche de l'utilisateur par son identifiant
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé !' });
        }
        console.log(user);
        // Recherche du jeu correspondant dans la liste des jeux de l'utilisateur
        const game = user.games.find(game => game.id.toString() === gameId);
        if (!game) {
            // Si le jeu n'existe pas encore dans la liste des jeux de l'utilisateur, on le crée
            user.games.push({
                id: gameId,
                qrcodesFind: [qrCode],
                playerAdvancement: false
            });
            console.log("Initialisation du jeu pour la première fois")
        } else {
            // Si le jeu existe déjà, on récupère les informations du jeu
            console.log(game)

            // Vérification si le qrcode existe déjà dans la liste des qrcodes trouvés pour le jeu donné
            if (game.qrcodesFind.includes(qrCode)) {
                return res.status(400).json({ error: 'QR code déjà trouvé pour ce jeu !' });
            }

            // Ajout du nouveau qrcode dans la liste des qrcodes trouvés pour le jeu donné
            game.qrcodesFind.push(qrCode);
            console.log(game.qrcodesFind)

            // Mise à jour de l'avancement de l'utilisateur pour le jeu donné
            const isGameCompleted = game.qrcodesFind.length === game.id.nbQrCodes;
            game.playerAdvancement = isGameCompleted;
        }

        // Sauvegarde des modifications de l'utilisateur dans la base de données
        await user.save();

        // Envoi de la réponse au client
        return res.status(200).json({
            message: 'Informations utilisateur mises à jour avec succès !'
        });
    } catch (error) {
        // Gestion des erreurs
        console.log(error)
        return res.status(500).json({ error });
    }
};