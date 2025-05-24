import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import UserModel, { ROLES } from '../models/user_model';
import MessageModel from '../models/message_model';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model';

dotenv.config();

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
      isEmailVerified: true,
    });

    await admin.save();

    return res.status(201).json({ success: true, message: 'Admin account created successfully' });
  } catch (error) {
    console.error('Setup admin error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Assign role to user
export const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    // Prevent assigning admin role
    if (role === ROLES.ADMIN) {
      return res.status(403).json({ error: 'Admin role cannot be assigned for security reasons' });
    }

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
        changedBy: req.user.uid,
      },
    }).save();

    return res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const allUsers = await UserModel.find({});
    
    // Transform the response to include necessary user information
    const formattedUsers = allUsers.map((user) => ({
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.isSuspended ? 'suspended' : 'active',
      publicKey: !!user.publicKey,
      createdAt: user.accountCreatedAt,
    }));
    
    return res.json({ users: formattedUsers.reverse() });
  } catch (error) {
    console.error('Error getting users:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Toggle user suspension status
export const toggleUserSuspension = async (req, res) => {
  try {
    const { userId } = req.body;

    // Prevent user suspension for security reasons
    return res.status(403).json({ 
      error: 'User suspension has been disabled for security reasons',
      success: false
    });

    /* Original code commented out
    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle suspension status
    user.isSuspended = !user.isSuspended;
    await user.save();

    // Log the suspension action
    await new AuditLogModel({
      actionType: user.isSuspended ? ACTION_TYPES.USER_SUSPENDED : ACTION_TYPES.USER_UNSUSPENDED,
      targetId: userId,
      metadata: {
        actionBy: req.user.uid,
        userEmail: user.email,
      },
    }).save();

    return res.json({
      success: true,
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      isSuspended: user.isSuspended,
    });
    */
  } catch (error) {
    console.error('Error toggling user suspension:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Get pending user registrations (users in IDLE state)
export const getPendingUsers = async (req, res) => {
  try {
    // Only get users who are idle AND have a requested role (meaning they're pending approval)
    // This excludes existing users who were made idle by admin
    const pendingUsers = await UserModel.find({ 
      role: ROLES.IDLE,
      requestedRole: { $exists: true, $ne: null }
    });

    // Transform the response to include email and requested role
    const usersWithEmail = pendingUsers.map((user) => ({
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      requestedRole: user.requestedRole || 'user', // Default to 'user' if not specified
      requestedAt: user.requestedAt,
      accountCreatedAt: user.accountCreatedAt,
    }));

    return res.json({ pendingUsers: usersWithEmail });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Reject a pending user registration
export const rejectUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find the user to reject
    const user = await UserModel.findOne({ uid: userId, role: ROLES.IDLE });
    if (!user) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    // Log the rejection action before deleting
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_REJECTED,
      targetId: userId,
      metadata: {
        reason: reason || 'Rejected by admin',
        rejectedBy: req.user.uid,
        userEmail: user.email,
      },
    }).save();

    // Delete the user account
    await UserModel.deleteOne({ uid: userId });

    return res.json({ success: true, message: 'User registration rejected and account removed' });
  } catch (error) {
    console.error('Error rejecting user:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Get dashboard statistics (counts only)
export const getDashboardStats = async (req, res) => {
  try {
    // Check if requester is admin
    const admin = await UserModel.findOne({ uid: req.user.uid, role: ROLES.ADMIN });
    if (!admin) {
      return res.status(403).json({ error: 'Only administrators can access dashboard statistics' });
    }
    
    // Get counts without fetching all the data
    const regularUserCount = await UserModel.countDocuments({ role: ROLES.USER });
    const moderatorCount = await UserModel.countDocuments({ role: ROLES.MODERATOR });
    const suspendedUserCount = await UserModel.countDocuments({ isSuspended: true });
    const pendingUserCount = await UserModel.countDocuments({ 
      role: ROLES.IDLE, 
      requestedRole: { $exists: true, $ne: null } 
    }); // Count only users awaiting approval, not those made idle by admin
    const messageCount = await MessageModel.countDocuments({});
    const flaggedCount = await MessageModel.countDocuments({ 'isFlagged.status': true });
    
    return res.json({
      userCount: regularUserCount,
      moderatorCount,
      suspendedUserCount,
      moderatorRequestCount: pendingUserCount, // Renamed for backwards compatibility
      messageCount,
      flaggedCount,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Make moderator idle (prevents login)
export const makeModeratorIdle = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow making moderators idle (not regular users or admins)
    if (user.role !== ROLES.MODERATOR) {
      return res.status(400).json({ 
        error: 'This action can only be performed on moderators' 
      });
    }

    // Prevent admin from making themselves idle
    if (req.user.uid === userId) {
      return res.status(400).json({ 
        error: 'You cannot make yourself idle' 
      });
    }

    const previousRole = user.role;
    user.updateRole(ROLES.IDLE);
    
    // Clear requestedRole to ensure they don't appear in pending registrations
    user.requestedRole = null;
    user.requestedAt = null;
    
    await user.save();

    // Log the action
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_ROLE_CHANGED,
      targetId: userId,
      metadata: {
        previousRole,
        newRole: ROLES.IDLE,
        reason: reason || 'Made idle by admin',
        changedBy: req.user.uid,
        userEmail: user.email,
        action: 'moderator_made_idle',
      },
    }).save();

    return res.json({
      success: true,
      message: `Moderator ${user.name} has been made idle and can no longer log in`,
    });
  } catch (error) {
    console.error('Error making moderator idle:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Reactivate idle moderator
export const reactivateModerator = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow reactivating idle users who were previously moderators
    if (user.role !== ROLES.IDLE) {
      return res.status(400).json({ 
        error: 'User is not currently idle' 
      });
    }

    // Check if user was previously a moderator
    const wasModeratorBefore = user.roleHistory.some(
      history => history.role === ROLES.MODERATOR
    );

    if (!wasModeratorBefore) {
      return res.status(400).json({ 
        error: 'This user was not previously a moderator and cannot be reactivated as one' 
      });
    }

    const previousRole = user.role;
    user.updateRole(ROLES.MODERATOR);
    await user.save();

    // Log the action
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_ROLE_CHANGED,
      targetId: userId,
      metadata: {
        previousRole,
        newRole: ROLES.MODERATOR,
        reason: 'Reactivated by admin',
        changedBy: req.user.uid,
        userEmail: user.email,
        action: 'moderator_reactivated',
      },
    }).save();

    return res.json({
      success: true,
      message: `Moderator ${user.name} has been reactivated and can now log in`,
    });
  } catch (error) {
    console.error('Error reactivating moderator:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
