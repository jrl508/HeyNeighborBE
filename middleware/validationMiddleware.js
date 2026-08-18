const { body } = require('express-validator');

const validateRegister = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
};
