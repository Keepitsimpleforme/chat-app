const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Make sure we have the user ID in the decoded token
    if (!decoded.id && !decoded.userId) {
      return res.status(403).json({ message: 'Invalid token format' });
    }
    // Set the user ID in the request
    req.user = { id: decoded.id || decoded.userId };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ message: 'Invalid token' });
  }
};