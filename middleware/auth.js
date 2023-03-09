// Importe la bibliothèque jsonwebtoken pour vérifier les tokens
const jwt = require('jsonwebtoken');

// Exportation d'une fonction qui vérifie le token dans la requête
module.exports = (req, res, next) => {
   try {
       // Récupère le token de la requête, dans le champ authorization, séparé par un espace
       const token = req.headers.authorization.split(' ')[1];
       
       // Vérifie la validité du token avec le secret RANDOM_TOKEN_SECRET
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
       
       // Récupère l'identifiant de l'utilisateur contenu dans le token décodé
       const userId = decodedToken.userId;
       
       // Ajoute l'identifiant de l'utilisateur à la requête pour être utilisé plus tard
       req.auth = {
           userId: userId
       };
       
       // Appelle le prochain middleware
       next();
   } catch(error) {
       // Retourne une erreur 401 si le token est incorrect
       console.log("non auth")
       res.status(401).json({ error });
   }
};
