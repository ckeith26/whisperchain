import jwt from 'jwt-simple';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import UserModel, { ROLES } from '../models/user_model';
import NameToIdModel from '../models/name_to_id_model';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model';

dotenv.config();

// Ensure JWT_SECRET is consistent with auth_service.js
const JWT_SECRET = process.env.JWT_SECRET || 'whisperchain_secure_fallback_key';

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if email is already taken
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // Generate a unique user ID
    const uid = nanoid(16);

    // Create a new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Use provided name or generate from email
    const userName = name || email.split('@')[0];

    const user = new UserModel({
      uid,
      email,
      name: userName,
      password: hashedPassword,
      role: (role === 'user' || role === 'moderator') ? role : ROLES.IDLE,
      roleHistory: [{ role: role || ROLES.IDLE, changedAt: new Date() }],
      accountCreatedAt: new Date(),
    });

    await user.save();

    // Create name to ID mapping
    const nameToId = new NameToIdModel({
      name: userName,
      uid,
    });

    await nameToId.save();

    // Log user creation
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_CREATED,
      targetId: uid,
      metadata: { name: userName, email },
    }).save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for admin approval to assign your role.',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and explicitly select the password field
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const timestamp = new Date().getTime();
    const token = jwt.encode({ 
      sub: user.uid, 
      iat: timestamp,
      role: user.role,
    }, JWT_SECRET);

    // Return user info and token
    return res.json({
      token,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Generate key pair for user
export const generateKeyPair = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // The actual key generation should happen on the frontend for security
    // The backend only stores the public key
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }

    user.publicKey = publicKey;
    await user.save();

    return res.json({ 
      success: true, 
      message: 'Public key stored successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Search users by name (for recipients)
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Find users whose names match the query
    const nameToIds = await NameToIdModel.find({
      name: { $regex: query, $options: 'i' },
    });
    
    // Also search by email
    const usersByEmail = await UserModel.find({
      email: { $regex: query, $options: 'i' },
    });
    
    // Combine results
    const emailUids = usersByEmail.map(user => user.uid);
    const nameUids = nameToIds.map(nameId => nameId.uid);
    
    // Get unique UIDs
    const uniqueUids = [...new Set([...emailUids, ...nameUids])];

    // Get user details for matching users
    const userDetails = await Promise.all(
      uniqueUids.map(async (uid) => {
        const user = await UserModel.findOne({ uid });
        if (user && !user.isSuspended) {
          return {
            uid: user.uid,
            name: user.name,
            email: user.email,
            // Only return limited info for privacy
          };
        }
        return null;
      })
    );

    // Filter out null values
    const filteredUsers = userDetails.filter(user => user !== null);

    return res.json({ users: filteredUsers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      publicKey: user.publicKey,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 