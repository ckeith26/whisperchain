import jwt from 'jwt-simple';
import dotenv from 'dotenv';
import UserModel, { ROLES } from '../models/user_model';

dotenv.config();

// Ensure JWT_SECRET is never undefined
const JWT_SECRET = process.env.JWT_SECRET || 'whisperchain_secure_fallback_key';

// Middleware to verify user JWT token
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid authentication format. Use Bearer {token}' });
    }

    try {
      const decodedToken = jwt.decode(token, JWT_SECRET);
      
      if (!decodedToken || !decodedToken.sub) {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      // For all users including admins, verify they exist in the users collection
      const user = await UserModel.findOne({ uid: decodedToken.sub });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (user.isSuspended) {
        return res.status(403).json({ error: 'Account is suspended' });
      }

      // Add user info to request object
      req.user = {
        uid: user.uid,
        role: user.role,
        email: user.email,
        name: user.name
      };

      next();
    } catch (jwtError) {
      console.error('JWT decode error:', jwtError.message);
      console.error('JWT decode error details:', jwtError);
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
  } catch (error) {
    console.error('Auth error:', error.message);
    console.error('Auth error details:', error);
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

// Middleware to check for specific role
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== role && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      error: `Access denied. Required role: ${role}`,
    });
  }

  next();
};

// Middleware for admin-only routes
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Middleware to verify user has moderator permissions
export const requireModerator = (req, res, next) => {
  if (!req.user || (req.user.role !== ROLES.MODERATOR && req.user.role !== ROLES.ADMIN)) {
    return res.status(403).json({ error: 'Moderator access required' });
  }

  next();
}; 