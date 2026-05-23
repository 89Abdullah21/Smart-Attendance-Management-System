const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_jwt_secret_token_key_generation_phrase_here';

/**
 * Middleware to verify JWT and attach user payload to the request.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing or invalid.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token expired or access forbidden.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware to check specific role authorization.
 * @param {string[]} roles 
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access for this user role.' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
