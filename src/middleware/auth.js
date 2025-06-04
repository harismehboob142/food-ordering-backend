const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to request object
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check user role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { role } = req.user;
    
    if (!roles.includes(role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware to check country access
const checkCountryAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  // For non-admin roles, check country
  const { country } = req.user;
  
  // Add country filter to request for use in controllers
  req.countryFilter = { country };
  
  next();
};

module.exports = { verifyToken, checkRole, checkCountryAccess };
