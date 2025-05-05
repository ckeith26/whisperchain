import UserModel, { ROLES } from '../models/user_model';
import MessageModel from '../models/message_model';
import AuthTokenModel from '../models/auth_token_model';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model';

// Get flagged messages for moderator review
export const getFlaggedMessages = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Verify user has moderator permissions
    const user = await UserModel.findOne({ uid: userId });
    if (!user || user.role !== ROLES.MODERATOR) {
      return res.status(403).json({ error: 'You do not have permission to view flagged messages' });
    }

    // Find flagged messages
    const flaggedMessages = await MessageModel.find({
      'isFlagged.status': true
    });

    return res.json({
      success: true,
      flaggedMessages: flaggedMessages.map(message => ({
        messageId: message.messageId,
        content: message.content, // Encrypted content
        senderToken: message.senderToken,
        recipientUid: message.recipientUid,
        round: message.round,
        sentAt: message.sentAt,
        flaggedAt: message.isFlagged.timestamp
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Freeze a token associated with a message
export const freezeToken = async (req, res) => {
  try {
    const moderatorId = req.user.uid;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify moderator permissions
    const moderator = await UserModel.findOne({ uid: moderatorId });
    if (!moderator || moderator.role !== ROLES.MODERATOR) {
      return res.status(403).json({ error: 'You do not have permission to freeze tokens' });
    }

    // Find and freeze the token
    const tokenDoc = await AuthTokenModel.findOne({ token });
    if (!tokenDoc) {
      return res.status(404).json({ error: 'Token not found' });
    }

    tokenDoc.isFrozen = {
      status: true,
      timestamp: new Date(),
      modUid: moderatorId
    };
    await tokenDoc.save();

    // Log the token freeze action
    await new AuditLogModel({
      actionType: ACTION_TYPES.TOKEN_FROZEN,
      tokenId: token,
      role: ROLES.MODERATOR,
      targetId: tokenDoc.uid,
      metadata: { moderatorId }
    }).save();

    return res.json({
      success: true,
      message: 'Token frozen successfully'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// View audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Verify moderator permissions
    const moderator = await UserModel.findOne({ uid: userId });
    if (!moderator || moderator.role !== ROLES.MODERATOR) {
      return res.status(403).json({ error: 'You do not have permission to view audit logs' });
    }

    // Parse query parameters for filtering
    const { actionType, round, startDate, endDate, limit = 100 } = req.query;
    
    const query = {};
    if (actionType) query.actionType = actionType;
    if (round) query.round = parseInt(round, 10);
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get audit logs with pagination
    const auditLogs = await AuditLogModel.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    return res.json({
      success: true,
      auditLogs
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 