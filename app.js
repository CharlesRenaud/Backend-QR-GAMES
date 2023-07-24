const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const path = require('path');

// Import des routes associées aux utilisateurs et aux jeux
const userRoutes = require('./routes/user');
const userGames = require('./routes/game');
const scriptRoutes = require('./routes/scripts');

// Création de l'application avec Express
const app = express();

// Connexion à la base de données MongoDB
mongoose.connect(`URL_DB`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: true
});

// Vérification de la connexion à la base de données
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connecté à la base de données');
});

// Définition des en-têtes CORS pour les requêtes HTTP
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Configuration de body-parser pour le traitement des données JSON
app.use(bodyParser.json());

// Utilisation des routes associées aux utilisateurs et aux jeux
app.use('/api/scripts', scriptRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/game', userGames);

// Configuration du dossier d'images pour Multer
app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/api/', (req, res) => {
    res.send('Hello, World Jeego API!');
  });
  

// Exportation de l'application en tant que module
module.exports = app;
