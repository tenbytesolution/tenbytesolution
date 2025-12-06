const express = require('express');
const router = express.Router();

// Import route modules
const publicRoutes = require('./publicRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');

// Mount routes
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);

module.exports = router;