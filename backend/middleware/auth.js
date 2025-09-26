const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.role === 'client') {
      user = await Client.findById(decoded.id).select('-password');
    } else if (decoded.role === 'supplier') {
      user = await Supplier.findById(decoded.id).select('-password');
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Authorization failed: User not found or inactive.' });
    }

    req.user = user;
    req.user.id = user._id;
    req.user.role = decoded.role;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    }
    next();
  };
};

module.exports = { auth, authorize };