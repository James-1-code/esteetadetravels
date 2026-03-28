const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-vercel-change-after';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  console.log('🔐 Auth middleware called');
  
  try {
    // Safe header check
    const authHeader = req?.headers?.authorization;
    console.log('📡 Auth header:', !!authHeader ? 'present' : 'missing');
    
    if (!authHeader || typeof authHeader !== 'string') {
      console.log('❌ No auth header');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid Bearer format:', authHeader.substring(0, 20) + '...');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }
    
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2) {
      console.log('❌ Invalid token parts');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }
    
    const token = tokenParts[1];
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.log('❌ Invalid token length');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    // Check JWT_SECRET
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET missing');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error.'
      });
    }
    
    console.log('🔑 Verifying JWT...');
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ JWT decoded, user ID:', decoded.id);
    } catch (jwtErr) {
      console.log('❌ JWT verify failed:', jwtErr.name || jwtErr.message);
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      if (jwtErr.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (!decoded || !decoded.id) {
      console.log('❌ No user ID in token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    // Safe DB query
    console.log('📊 Fetching user from DB, ID:', decoded.id);
    let result;
    try {
      result = await query(
        'SELECT id, email, first_name, last_name, role, referral_code, email_verified, admin_approved, COALESCE(avatar_url, \'\') as avatar_url FROM users WHERE id = $1',
        [decoded.id]
      );
    } catch (dbErr) {
      console.error('❌ DB query failed:', dbErr.message);
      return res.status(401).json({
        success: false,
        message: 'Authentication service unavailable.'
      });
    }
    
    if (!result || !result.rows || result.rows.length === 0) {
      console.log('❌ User not found in DB');
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    const user = result.rows[0];
    console.log('✅ User loaded:', user.id, user.email, user.role);
    
    // Agent approval check
    if (user.role === 'agent' && !user.admin_approved) {
      console.log('⏳ Agent pending approval');
      return res.status(403).json({
        success: false,
        message: 'Your agent account is pending admin approval.'
      });
    }
    
    // Set req.user safely
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatar_url: user.avatar_url
    };
    
    console.log('✅ Auth success, calling next()');
    next();
    
  } catch (error) {
    console.error('💥 Unexpected auth error:', error.message || error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login.',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
    
    next();
  };
};

// Optional authentication (for public routes that need user info if available)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    const result = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
    
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  JWT_SECRET,
};
