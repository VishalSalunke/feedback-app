const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and check if token is valid
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Add user from payload
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };
    
    // Debug logging
    console.log('Auth middleware:', {
      userId: decoded.userId,
      user: req.user
    });
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = auth;
