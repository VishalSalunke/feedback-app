const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Protected route example
router.get('/protected-route', auth, async (req, res) => {
  try {
    // The auth middleware adds the user to the request object
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Access granted',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in protected route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
