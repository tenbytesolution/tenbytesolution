const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Editor or Admin authorization middleware
const authorizeEditor = (req, res, next) => {
  if (!['admin', 'editor'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Editor privileges required.'
    });
  }
  next();
};

// Optional authentication middleware (doesn't block if no token)
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, jwtConfig.secret);
      req.user = decoded;
    }
  } catch (error) {
    // Don't block if token is invalid, just don't set req.user
    console.log('Optional auth failed:', error.message);
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeEditor,
  optionalAuthenticate
};
