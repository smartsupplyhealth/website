const { auth } = require('../middleware/auth'); // Importer le middleware auth

// Endpoint pour récupérer les informations de l'utilisateur connecté
exports.getCurrentUser = async (req, res) => {
  try {
    // Le middleware auth a déjà vérifié le token et ajouté req.user et req.role
    if (req.role === 'client') {
      res.status(200).json({
        success: true,
        clientId: req.user._id,
        role: req.role,
        name: req.user.name,
        email: req.user.email,
      });
    } else if (req.role === 'supplier') {
      res.status(200).json({
        success: true,
        supplierId: req.user._id,
        role: req.role,
        name: req.user.name,
        email: req.user.email,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Rôle non reconnu',
      });
    }
  } catch (error) {
    console.error('Erreur dans getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};