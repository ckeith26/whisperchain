import jwt from 'jwt-simple';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import UserModel, { ROLES } from '../models/user_model';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model';
import VerificationCodeModel from '../models/verification_code_model';
import sendVerificationEmail from '../services/email_service';

dotenv.config();

// Ensure JWT_SECRET is consistent with auth_service.js
const JWT_SECRET = process.env.JWT_SECRET || 'whisperchain_secure_fallback_key';

// Register new user
export const register = async (req, res) => {
  try {
    const {
      email, password, name, role, verificationCode,
    } = req.body;

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

    // If verification code is provided, verify it before registration
    if (verificationCode) {
      const verification = await VerificationCodeModel.findOne({
        email,
        code: verificationCode,
        isUsed: false,
      });

      if (!verification) {
        return res.status(401).json({ error: 'Invalid or expired verification code' });
      }

      // Mark the code as used
      verification.isUsed = true;
      await verification.save();
    } else {
      // If no verification code provided, send one
      // First check if there's an unexpired and unused code already (prevent request spam)
      const existingCode = await VerificationCodeModel.findOne({
        email,
        isUsed: false,
        createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }, // Less than 5 minutes old
      });

      if (existingCode) {
        // Calculate time remaining before a new code can be requested
        const expiryTime = new Date(existingCode.createdAt.getTime() + 5 * 60 * 1000);
        const now = new Date();
        const diffMs = expiryTime - now;

        if (diffMs > 0) {
          const diffSecs = Math.floor(diffMs / 1000);
          const minutes = Math.floor(diffSecs / 60);
          const seconds = diffSecs % 60;

          return res.status(429).json({
            error: 'A verification code has already been sent',
            timeRemaining: { minutes, seconds },
            message: `Please wait ${minutes}m ${seconds}s before requesting a new code`,
            requiresVerification: true,
          });
        }
      }

      // Generate a purely numeric 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Save the code
      const newVerificationCode = new VerificationCodeModel({
        email,
        code,
      });

      await newVerificationCode.save();

      // Send the code via email
      await sendVerificationEmail(email, code);

      return res.status(200).json({
        success: true,
        message: 'Verification code sent',
        requiresVerification: true,
      });
    }

    // Generate a unique user ID
    const uid = nanoid(16);

    // Use provided name or generate from email
    const userName = name || email.split('@')[0];

    // Determine user role based on registration
    let userRole;
    let requestedRole = null;
    let requiresApproval = false;

    if (role === 'moderator') {
      // Moderators require admin approval
      userRole = ROLES.IDLE;
      requestedRole = ROLES.MODERATOR;
      requiresApproval = true;
    } else {
      // Regular users are approved immediately
      userRole = ROLES.USER;
      requestedRole = null;
      requiresApproval = false;
    }

    // Create a new user - do NOT hash the password here, let the pre-save hook do it
    const user = new UserModel({
      uid,
      email,
      name: userName,
      password, // Plain password, will be hashed by the pre-save hook
      role: userRole,
      requestedRole,
      requestedAt: requiresApproval ? new Date() : null,
      roleHistory: [{ role: userRole, changedAt: new Date() }],
      accountCreatedAt: new Date(),
    });

    // Let the model's pre-save hook handle the password hashing
    const savedUser = await user.save();

    console.log('User saved:', {
      uid: savedUser.uid,
      email: savedUser.email,
      role: savedUser.role,
      requestedRole: savedUser.requestedRole,
      hasPassword: !!savedUser.password,
    });

    // Log user creation
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_CREATED,
      targetId: uid,
      metadata: { name: userName, email, requestedRole: savedUser.requestedRole || 'user' },
    }).save();

    // Handle different registration outcomes
    if (requiresApproval && savedUser.role === ROLES.IDLE) {
      // Moderator requests require approval
      console.log('Moderator registration pending approval:', email);
      return res.status(201).json({
        success: true,
        message: 'Registration successful. Your moderator request is awaiting admin approval. Please wait until an admin approves your request before logging in.',
        requiresApproval: true,
        requestedRole: savedUser.requestedRole,
      });
    }

    // Regular users are immediately active - create token and log them in
    const timestamp = Math.floor(Date.now() / 1000);
    const token = jwt.encode({
      sub: uid,
      iat: timestamp,
      exp: timestamp + (60 * 60 * 24 * 7), // 7 days
      role: savedUser.role,
    }, JWT_SECRET);

    console.log('User registration successful and logged in:', email);
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        uid: savedUser.uid,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, verificationCode } = req.body;
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
      passwordLength: user.password?.length,
    });

    // Check if account is currently locked
    if (user.isAccountLocked()) {
      const lockoutTimeRemaining = Math.ceil((user.accountLockedUntil - new Date()) / 1000);
      const minutes = Math.floor(lockoutTimeRemaining / 60);
      const seconds = lockoutTimeRemaining % 60;

      console.log('Account is locked:', email);
      return res.status(423).json({
        error: `Account is temporarily locked due to too many failed login attempts. Please try again in ${minutes}m ${seconds}s.`,
        accountLocked: true,
        timeRemaining: { minutes, seconds },
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      console.log('User is suspended:', email);
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Check if user is still pending approval
    if (user.role === ROLES.IDLE) {
      console.log('User account is pending approval:', email);
      return res.status(403).json({
        error: 'Your account is awaiting admin approval. Please check back later.',
        accountPending: true,
      });
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
        // Increment failed login attempts
        await user.incrementFailedAttempts();

        const attemptsRemaining = 5 - user.failedLoginAttempts;
        if (attemptsRemaining <= 0) {
          return res.status(423).json({
            error: 'Account has been temporarily locked due to too many failed login attempts. Please try again in 5 minutes.',
            accountLocked: true,
          });
        } else {
          return res.status(401).json({
            error: `Invalid credentials. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining before account lockout.`,
            attemptsRemaining,
          });
        }
      }

      // Reset failed login attempts on successful password verification
      await user.resetFailedAttempts();
    } catch (compareError) {
      console.error('Error during password comparison:', compareError.message);
      return res.status(500).json({ error: `Error comparing passwords: ${compareError.message}` });
    }

    // If verification code is provided, verify it
    if (verificationCode) {
      const verification = await VerificationCodeModel.findOne({
        email,
        code: verificationCode,
        isUsed: false,
      });

      if (!verification) {
        return res.status(401).json({ error: 'Invalid or expired verification code' });
      }

      // Mark the code as used
      verification.isUsed = true;
      await verification.save();
    } else {
      // First check if there's an unexpired and unused code already (prevent request spam)
      const existingCode = await VerificationCodeModel.findOne({
        email,
        isUsed: false,
        createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }, // Less than 5 minutes old
      });

      if (existingCode) {
        // Calculate time remaining before a new code can be requested
        const expiryTime = new Date(existingCode.createdAt.getTime() + 5 * 60 * 1000);
        const now = new Date();
        const diffMs = expiryTime - now;

        if (diffMs > 0) {
          const diffSecs = Math.floor(diffMs / 1000);
          const minutes = Math.floor(diffSecs / 60);
          const seconds = diffSecs % 60;

          return res.status(429).json({
            error: 'A verification code has already been sent',
            timeRemaining: { minutes, seconds },
            message: `Please wait ${minutes}m ${seconds}s before requesting a new code`,
          });
        }
      }

      // If no verification code provided, send one
      // Generate a purely numeric 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Save the code
      const newVerificationCode = new VerificationCodeModel({
        email,
        code,
      });

      await newVerificationCode.save();

      // Send the code via email
      await sendVerificationEmail(email, code);

      return res.status(200).json({
        success: true,
        message: 'Verification code sent',
        requiresVerification: true,
      });
    }

    // Create token
    const timestamp = Math.floor(Date.now() / 1000);
    const token = jwt.encode({
      sub: user.uid,
      iat: timestamp,
      exp: timestamp + (60 * 60 * 24 * 7), // 7 days
      role: user.role,
    }, JWT_SECRET);

    console.log('Login successful for user:', email);
    return res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
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

    // Check if user already has a public key - prevent regeneration
    if (user.publicKey) {
      return res.status(400).json({
        error: 'Key pair already exists. Cannot regenerate existing keys for security reasons.',
      });
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
    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = page * limit;

    // Get current user's ID from authentication
    const currentUserUid = req.user.uid;

    const userQuery = {
      role: ROLES.USER,
      isSuspended: false,
      uid: { $ne: currentUserUid }, // Exclude current user
    };

    // If search query is provided, search by name or email
    if (query && query.trim() !== '') {
      const searchRegex = { $regex: query, $options: 'i' };

      // Find users by email or name
      const users = await UserModel.find({
        $or: [
          { email: searchRegex },
          { name: searchRegex },
        ],
        ...userQuery,
      })
        .select('uid name email publicKey')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      return res.json({
        users,
        hasMore: users.length === limit,
        page,
      });
    }

    // If no query provided, return paginated list of all users
    const users = await UserModel.find(userQuery)
      .select('uid name email publicKey')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      users,
      hasMore: users.length === limit,
      page,
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
      hasKeyPair: !!user.publicKey,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
