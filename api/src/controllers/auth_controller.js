import jwt from 'jwt-simple';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import UserModel, { ROLES } from '../models/user_model';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model';

dotenv.config();

// Ensure JWT_SECRET is consistent with auth_service.js
const JWT_SECRET = process.env.JWT_SECRET || 'whisperchain_secure_fallback_key';

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    console.log('Registration attempt:', { email, role, passwordLength: password?.length });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if email is already taken
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Generate a unique user ID
    const uid = nanoid(16);
    
    // Use provided name or generate from email
    const userName = name || email.split('@')[0];

    // Create a new user - do NOT hash the password here, let the pre-save hook do it
    const user = new UserModel({
      uid,
      email,
      name: userName,
      password: password, // Plain password, will be hashed by the pre-save hook
      role: (role === 'user' || role === 'moderator') ? role : ROLES.IDLE,
      roleHistory: [{ role: role || ROLES.IDLE, changedAt: new Date() }],
      accountCreatedAt: new Date(),
    });

    // Let the model's pre-save hook handle the password hashing
    const savedUser = await user.save();
    
    console.log('User saved:', {
      uid: savedUser.uid,
      email: savedUser.email,
      role: savedUser.role,
      hasPassword: !!savedUser.password
    });

    // Log user creation
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_CREATED,
      targetId: uid,
      metadata: { name: userName, email },
    }).save();

    // Create token
    const timestamp = Math.floor(Date.now() / 1000);
    const token = jwt.encode({
      sub: uid,
      iat: timestamp,
      exp: timestamp + (60 * 60 * 24 * 7), // 7 days
      role: savedUser.role
    }, JWT_SECRET);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        uid: savedUser.uid,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Find user by email and explicitly select the password field
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'User does not exist' });
    }

    console.log('User found:', { 
      uid: user.uid, 
      role: user.role, 
      hasPassword: !!user.password, 
      passwordLength: user.password?.length 
    });

    // Check if user is suspended
    if (user.isSuspended) {
      console.log('User is suspended:', email);
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Check if password field exists
    if (!user.password) {
      console.log('Password field missing for user:', email);
      return res.status(500).json({ error: 'User password not properly stored' });
    }

    // Compare passwords using the method from the User model
    try {
      console.log('Comparing passwords. Password exists:', !!user.password);
      const isMatch = await user.comparePassword(password);
      console.log('Password comparison result:', isMatch);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (compareError) {
      console.error('Error during password comparison:', compareError.message);
      return res.status(500).json({ error: 'Error comparing passwords: ' + compareError.message });
    }

    // Create token
    const timestamp = Math.floor(Date.now() / 1000);
    const token = jwt.encode({
      sub: user.uid,
      iat: timestamp,
      exp: timestamp + (60 * 60 * 24 * 7), // 7 days
      role: user.role
    }, JWT_SECRET);

    console.log('Login successful for user:', email);

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
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;
    
    // Get current user's ID from authentication
    const currentUserUid = req.user.uid;
    
    let userQuery = {
      role: ROLES.USER,
      isSuspended: false,
      uid: { $ne: currentUserUid } // Exclude current user
    };
    
    // If search query is provided, search by name or email
    if (query && query.trim() !== '') {
      const searchRegex = { $regex: query, $options: 'i' };
      
      // Find users by email or name
      const users = await UserModel.find({
        $or: [
          { email: searchRegex },
          { name: searchRegex }
        ],
        ...userQuery
      })
      .select('uid name email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
      
      return res.json({ 
        users,
        hasMore: users.length === limit,
        page
      });
    }
    
    // If no query provided, return paginated list of all users
    const users = await UserModel.find(userQuery)
      .select('uid name email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    return res.json({ 
      users,
      hasMore: users.length === limit,
      page
    });
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