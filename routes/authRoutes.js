const express = require('express');
const userController = require('../controllers/userController');
const { validateRegister } = require('../middleware/validationMiddleware');  // Updated import
const router = express.Router();

// Routes
router.post('/register', validateRegister, userController.registerUser);
router.post('/login', userController.loginUser);

module.exports = router;
