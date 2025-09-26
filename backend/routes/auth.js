const express = require('express');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');
const { auth } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  checkValidation 
} = require('../middleware/validation');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const authController = require('../controllers/authController');

const router = express.Router();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};


// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateRegister, checkValidation, async (req, res) => {
  try {
    const { role, email, name } = req.body;

    if (!['client', 'supplier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    let existingUser;
    if (role === 'client') {
      existingUser = await Client.findOne({ email });
    } else if (role === 'supplier') {
      existingUser = await Supplier.findOne({ email });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    let user;
    if (role === 'client') {
      // Create a Stripe customer for the new client
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        description: 'New client for SmartSupply-Health',
      });

      // Create a new client with the Stripe Customer ID
      user = new Client({
        ...req.body,
        stripeCustomerId: customer.id, // <-- SAVE THE STRIPE ID
      });

    } else if (role === 'supplier') {
      user = new Supplier(req.body);
    }

    await user.save();

    const token = generateToken(user._id, role);

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully', 
      data: { user, token } 
    });

  } catch (error) {
    console.error('Registration error:', error);
    // If there's a Stripe error, it will be caught here as well
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, checkValidation, async (req, res) => {
  const { email, password, role } = req.body;

  console.log('Login attempt:', email, role);

  if (!['client', 'supplier'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be either client or supplier' });
  }

  let user;
  if (role === 'client') {
    user = await Client.findOne({ email });
  } else if (role === 'supplier') {
    user = await Supplier.findOne({ email });
  }

  if (!user) {
    console.log('User not found');
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    console.log('Wrong password');
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    console.log('User inactive');
    return res.status(403).json({ success: false, message: 'User is inactive' });
  }

  const token = generateToken(user._id, role);
  console.log('Login successful for:', email);

// Dans votre route login, juste avant res.json()
console.log('Données envoyées au frontend:', { user: user.toObject(), token, role });
res.json({ success: true, message: 'Login successful', data: { user, token, role } });});



// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { role } = req.user;
    const Model = role === 'client' ? Client : Supplier;
    
    const user = await Model.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Mettre à jour les champs fournis dans la requête
    const allowedFields = ['name', 'phone', 'clinicName', 'clinicType', 'address', 'companyName', 'password'];
    
    Object.keys(req.body).forEach(key => {
      // On met à jour le champ seulement s'il est permis et non vide (sauf pour le mot de passe)
      if (allowedFields.includes(key) && (req.body[key] || key === 'password' && req.body[key])) {
        user[key] = req.body[key];
      }
    });

    // La méthode .save() va déclencher le hook pre('save') qui cryptera le mot de passe si nécessaire
    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    // Gérer les erreurs de validation (ex: email déjà pris si on permettait de le changer)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!['client', 'supplier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const Model = role === 'client' ? Client : Supplier;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 900000; // 15 minutes

    await user.save();

    const subject = 'Your Password Reset Code';
    const html = `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                  <p>Your verification code is: <strong>${resetToken}</strong></p>
                  <p>This code will expire in 15 minutes.</p>
                  <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;

    await sendEmail(user.email, subject, html);

    res.json({ success: true, message: 'A verification code has been sent to your email.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with verification code
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, role, token, password } = req.body;
    if (!['client', 'supplier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const Model = role === 'client' ? Client : Supplier;
    const user = await Model.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;