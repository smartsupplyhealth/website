const { body, validationResult } = require('express-validator');

// Validation rules for registration
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['client', 'supplier'])
    .withMessage('Role must be either client or supplier'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  // Conditional validations
  body('clinicName')
    .if(body('role').equals('client'))
    .notEmpty()
    .withMessage('Clinic name is required for clients'),
  
  body('clinicType')
    .if(body('role').equals('client'))
    .isIn(['clinic', 'laboratory', 'medical_office'])
    .withMessage('Invalid clinic type'),
  
  body('address')
    .if(body('role').equals('client'))
    .notEmpty()
    .withMessage('Address is required for clients'),
  
  body('companyName')
    .if(body('role').equals('supplier'))
    .notEmpty()
    .withMessage('Company name is required for suppliers')
];

// Validation rules for login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  checkValidation
};