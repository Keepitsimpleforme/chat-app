const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middlware/authmiddleware');

// GET /api/users/me - Get current user's data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// GET /api/users/online (placeholder: this would be served via sockets ideally)
router.get('/online', auth, async (req, res) => {
  try {
    // Ideally, you'd get this list from the socket map
    const users = await User.find({ _id: { $ne: req.user.id } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;