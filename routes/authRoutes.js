const express = require('express');
const userController = require('../controllers/userController');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
} = require('../middleware/validationMiddleware');
const router = express.Router();

// Routes
router.post('/register', validateRegister, userController.registerUser);
router.post('/login', validateLogin, userController.loginUser);
router.post('/google', userController.googleLogin);
router.post('/forgot-password', validateForgotPassword, userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
