const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authValidation } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authValidation.register, AuthController.register);
router.post('/login', authValidation.login, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
