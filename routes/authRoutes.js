const express = require('express');
const userController = require('../controllers/userController');
const { validateRegister } = require('../middleware/validationMiddleware');  // Updated import
const router = express.Router();

// Routes
router.post('/register', validateRegister, userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/google', userController.googleLogin);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
