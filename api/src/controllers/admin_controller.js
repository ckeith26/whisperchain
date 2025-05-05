import jwt from 'jwt-simple';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import UserModel, { ROLES } from '../models/user_model';
import RoundModel from '../models/round_model';
import AuthTokenModel from '../models/auth_token_model';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model';
import { nanoid } from 'nanoid';

dotenv.config();

// Ensure JWT_SECRET is consistent with auth_service.js
const JWT_SECRET = process.env.JWT_SECRET || 'whisperchain_secure_fallback_key';

// Create initial admin account
export const setupAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ role: ROLES.ADMIN });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin account already exists' });
    }

    const { email, name, password } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Admin email is required' });
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Admin name is required' });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Generate a unique user ID
    const uid = nanoid(16);

    // Create new admin user
    const admin = new UserModel({
      uid,
      email,
      name,
      password,
      role: ROLES.ADMIN,
      roleHistory: [{ role: ROLES.ADMIN, changedAt: new Date() }],
      accountCreatedAt: new Date(),
      isEmailVerified: true
    });

    await admin.save();

    return res.status(201).json({ success: true, message: 'Admin account created successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Admin login (will be deprecated - use regular login instead)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find admin by email and explicitly select the password field
    const admin = await UserModel.findOne({ email, role: ROLES.ADMIN }).select('+password');
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const timestamp = new Date().getTime();
    const token = jwt.encode({ 
      sub: admin.uid, 
      iat: timestamp,
      role: admin.role
    }, JWT_SECRET);

    return res.json({ 
      token,
      user: {
        uid: admin.uid,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Assign role to user
export const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.updateRole(role);
    await user.save();

    // Log the role change action
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_ROLE_CHANGED,
      targetId: userId,
      metadata: { 
        previousRole: user.roleHistory[user.roleHistory.length - 2]?.role || 'none',
        newRole: role,
        changedBy: req.user.uid
      }
    }).save();

    return res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Start a new message round
export const startRound = async (req, res) => {
  try {
    // Check if there's an active round
    const activeRound = await RoundModel.findOne({ isActive: true });
    if (activeRound) {
      return res.status(400).json({ error: 'A round is already active' });
    }

    // Get the last round number or start with 1
    const lastRound = await RoundModel.findOne().sort({ roundNumber: -1 });
    const newRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

    // Create a new round
    const round = new RoundModel({
      roundNumber: newRoundNumber,
      isActive: true,
      startedAt: new Date(),
      createdBy: req.user ? req.user.uid : 'admin'
    });
    await round.save();

    // Generate new tokens for eligible users
    const eligibleUsers = await UserModel.find({ 
      role: { $in: [ROLES.SENDER, ROLES.RECIPIENT] },
      isSuspended: false
    });

    const tokens = [];
    for (const user of eligibleUsers) {
      const token = new AuthTokenModel({
        uid: user.uid,
        token: nanoid(32), // Generate secure unique token
        round: newRoundNumber,
        issuedAt: new Date()
      });
      await token.save();
      tokens.push({ uid: user.uid, token: token.token });
    }

    // Log the round start action
    await new AuditLogModel({
      actionType: ACTION_TYPES.ROUND_STARTED,
      role: 'admin',
      round: newRoundNumber,
      metadata: { totalTokensIssued: tokens.length }
    }).save();

    return res.status(201).json({ 
      success: true, 
      message: 'New round started', 
      roundNumber: newRoundNumber,
      tokensIssued: tokens.length
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// End the current message round
export const endRound = async (req, res) => {
  try {
    // Find the active round
    const activeRound = await RoundModel.findOne({ isActive: true });
    if (!activeRound) {
      return res.status(400).json({ error: 'No active round found' });
    }

    // End the round
    activeRound.isActive = false;
    activeRound.endedAt = new Date();
    await activeRound.save();

    // Log the round end action
    await new AuditLogModel({
      actionType: ACTION_TYPES.ROUND_ENDED,
      role: 'admin',
      round: activeRound.roundNumber,
      metadata: { roundDuration: activeRound.endedAt - activeRound.startedAt }
    }).save();

    return res.json({ 
      success: true, 
      message: 'Round ended', 
      roundNumber: activeRound.roundNumber 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get pending user registrations (users in IDLE state)
export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await UserModel.find({ role: ROLES.IDLE });
    
    // Transform the response to include email
    const usersWithEmail = pendingUsers.map(user => ({
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      accountCreatedAt: user.accountCreatedAt,
    }));
    
    return res.json({ pendingUsers: usersWithEmail });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 