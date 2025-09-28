const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - decoded token:', decoded);

    let user;
    if (decoded.role === 'client') {
      console.log('Auth middleware - looking for client with ID:', decoded.id);
      user = await Client.findById(decoded.id).select('-password');
    } else if (decoded.role === 'supplier') {
      console.log('Auth middleware - looking for supplier with ID:', decoded.id);
      user = await Supplier.findById(decoded.id).select('-password');
    }

    console.log('Auth middleware - user found:', user ? 'Yes' : 'No');
    console.log('Auth middleware - user active:', user?.isActive);

    if (!user || !user.isActive) {
      console.log('Auth middleware - User not found or inactive');
      return res.status(401).json({ message: 'Authorization failed: User not found or inactive.' });
    }

    req.user = user;
    req.user.id = user._id;
    req.user.role = decoded.role;

    console.log('Auth middleware - User authenticated successfully:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });

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