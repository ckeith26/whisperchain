import dotenv from 'dotenv';
import UserModel, { ROLES } from '../models/user_model.js';
import MessageModel from '../models/message_model.js';
import AuthTokenModel from '../models/auth_token_model.js';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model.js';
import FlaggedMessageModel from '../models/flagged_message_model.js';
import { decryptWithServerKeyCompat, encryptWithModeratorKey } from '../utils/crypto.js';

dotenv.config();

// Get flagged messages for moderator review
export const getFlaggedMessages = async (req, res) => {
  try {
    const userId = req.user.uid;
    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = page * limit;

    // Verify user is a moderator
    const moderator = await UserModel.findOne({
      uid: userId,
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
    });

    if (!moderator) {
      return res.status(403).json({
        error: 'You do not have permission to access flagged messages',
      });
    }

    // Check if moderator has public key set up
    if (!moderator.moderatorPublicKey) {
      return res.status(400).json({
        error: 'Moderator public key not found. Please generate a key pair first.',
      });
    }

    // Get flagged messages from the new collection
    const flaggedMessages = await FlaggedMessageModel.find({
      moderationStatus: 'pending', // Only show pending messages
    })
      .sort({ flaggedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await FlaggedMessageModel.countDocuments({
      moderationStatus: 'pending',
    });

    // Process messages - decrypt server content and re-encrypt for moderator
    const processedMessages = await Promise.all(
      flaggedMessages.map(async (flaggedMsg) => {
        try {
          let moderatorContent = null;

          if (flaggedMsg.serverEncryptedContent) {
            try {
              // Decrypt with server key and re-encrypt for this specific moderator
              let decryptedContent = decryptWithServerKeyCompat(flaggedMsg.serverEncryptedContent);
              
              // Check if the result is still encrypted (double encryption case)
              const looksLikeEncrypted = (content) => {
                return content.length > 50 && content.length < 2000 && /^[A-Za-z0-9+/=]+$/.test(content);
              };
              
              if (looksLikeEncrypted(decryptedContent)) {
                try {
                  const doubleDecrypted = decryptWithServerKeyCompat(decryptedContent);
                  decryptedContent = doubleDecrypted;
                } catch (doubleDecryptError) {
                  // Use first decryption result if second fails
                }
              }
              
              moderatorContent = encryptWithModeratorKey(decryptedContent, moderator.moderatorPublicKey);
              
            } catch (decryptError) {
              console.error(`Cannot decrypt flagged message ${flaggedMsg._id}:`, decryptError.message);
              moderatorContent = null;
            }
          } else {
            console.log(`No serverEncryptedContent for message ${flaggedMsg._id}`);
          }

          // Fetch recipient information
          const recipient = await UserModel.findOne({ uid: flaggedMsg.recipientUid });

          const result = {
            messageId: flaggedMsg.originalMessageId,
            flaggedMessageId: flaggedMsg._id,
            content: '', // Don't expose original encrypted content
            moderatorContent,
            senderUid: flaggedMsg.senderUid,
            recipient: recipient
              ? {
                uid: recipient.uid,
                email: recipient.email,
                displayName: recipient.displayName || recipient.name,
              }
              : { uid: flaggedMsg.recipientUid, email: 'Unknown User', displayName: 'Unknown User' },
            sentAt: flaggedMsg.originalSentAt,
            flaggedAt: flaggedMsg.flaggedAt,
            flaggedBy: flaggedMsg.flaggedBy,
            moderationStatus: flaggedMsg.moderationStatus,
          };
          
          return result;
        } catch (error) {
          console.error(`Error processing flagged message ${flaggedMsg._id}:`, error);

          // Return message without moderator content if processing fails
          return {
            messageId: flaggedMsg.originalMessageId,
            flaggedMessageId: flaggedMsg._id,
            content: '',
            moderatorContent: null,
            senderUid: flaggedMsg.senderUid,
            recipient: { uid: flaggedMsg.recipientUid, email: 'Unknown User', displayName: 'Unknown User' },
            sentAt: flaggedMsg.originalSentAt,
            flaggedAt: flaggedMsg.flaggedAt,
            flaggedBy: flaggedMsg.flaggedBy,
            moderationStatus: flaggedMsg.moderationStatus,
          };
        }
      }),
    );

    return res.json({
      success: true,
      messages: processedMessages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching flagged messages:', error);
    return res.status(500).json({
      error: 'Failed to fetch flagged messages',
    });
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
      return res
        .status(403)
        .json({ error: 'You do not have permission to freeze tokens' });
    }

    // Find and freeze the token
    const tokenDoc = await AuthTokenModel.findOne({ token });
    if (!tokenDoc) {
      return res.status(404).json({ error: 'Token not found' });
    }

    tokenDoc.isFrozen = {
      status: true,
      timestamp: new Date(),
      modUid: moderatorId,
    };
    await tokenDoc.save();

    // Log the token freeze action
    await new AuditLogModel({
      actionType: ACTION_TYPES.TOKEN_FROZEN,
      tokenId: token,
      role: ROLES.MODERATOR,
      targetId: tokenDoc.uid,
      metadata: { moderatorId },
    }).save();

    return res.json({
      success: true,
      message: 'Token frozen successfully',
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
      return res
        .status(403)
        .json({ error: 'You do not have permission to view audit logs' });
    }

    // Parse query parameters for filtering
    const {
      actionType,
      startDate,
      endDate,
      limit = 100,
    } = req.query;

    const query = {};
    if (actionType) query.actionType = actionType;

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
      auditLogs,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get count of flagged messages for badge display
export const getFlaggedMessageCount = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Verify user is a moderator
    const moderator = await UserModel.findOne({
      uid: userId,
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
    });

    if (!moderator) {
      return res.status(403).json({
        error: 'You do not have permission to access flagged message count',
      });
    }

    // Count pending flagged messages in the new collection
    const count = await FlaggedMessageModel.countDocuments({
      moderationStatus: 'pending',
    });

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error getting flagged message count:', error);
    return res.status(500).json({
      error: 'Failed to get flagged message count',
    });
  }
};

// Get token information (for moderators only)
export const getTokenInfo = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { tokenId } = req.params;

    // Verify moderator status
    const moderator = await UserModel.findOne({
      uid: userId,
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
    });

    if (!moderator) {
      return res.status(403).json({
        error: "You do not have permission to access token information",
      });
    }

    if (!tokenId) {
      return res.status(400).json({ error: "Token ID is required" });
    }

    // Find token and associated user
    const authToken = await AuthTokenModel.findOne({ token: tokenId });
    if (!authToken) {
      return res.status(404).json({ error: "Token not found" });
    }

    // Return only the user ID for anonymity purposes
    return res.json({
      success: true,
      userId: authToken.uid,
    });
  } catch (error) {
    console.error("Error getting token info:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Handle message moderation action (approve/reject/address)
export const moderateMessage = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { messageId, action, note } = req.body;

    if (!messageId || !action) {
      return res
        .status(400)
        .json({ error: 'Message ID and action are required' });
    }

    // Verify moderator status
    const moderator = await UserModel.findOne({
      uid: userId,
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
    });

    if (!moderator) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to moderate messages' });
    }

    // Find the flagged message entry (not the original message)
    const flaggedMessage = await FlaggedMessageModel.findOne({ 
      originalMessageId: messageId,
      moderationStatus: 'pending' 
    });
    if (!flaggedMessage) {
      return res.status(404).json({ error: 'Flagged message not found' });
    }

    // Also get the original message for some actions
    const originalMessage = await MessageModel.findOne({ messageId });

    // Handle different actions
    switch (action) {
      case 'approve':
        // Mark as approved in flagged messages
        flaggedMessage.moderationStatus = 'approved';
        flaggedMessage.moderatedBy = userId;
        flaggedMessage.moderatedAt = new Date();
        flaggedMessage.moderationNote = note || 'Approved by moderator';
        
        // Clear flag on original message if it exists
        if (originalMessage) {
          originalMessage.isFlagged = {
            status: false,
            timestamp: null,
            modUid: userId,
          };
          await originalMessage.save();
        }
        break;
        
      case 'reject':
        // Mark as rejected in flagged messages
        flaggedMessage.moderationStatus = 'rejected';
        flaggedMessage.moderatedBy = userId;
        flaggedMessage.moderatedAt = new Date();
        flaggedMessage.moderationNote = note || 'Rejected by moderator';
        
        // Keep flag on original message if it exists
        if (originalMessage) {
          originalMessage.isFlagged = {
            ...originalMessage.isFlagged,
            modUid: userId,
          };
          await originalMessage.save();
        }
        break;
        
      case 'suspend_sender': {
        // Find the sender and suspend them
        let senderUid = flaggedMessage.senderUid;
        
        // If senderUid is unknown, try to look it up from the original message token
        if (senderUid === 'unknown' && originalMessage && originalMessage.senderToken) {
          console.log('SenderUid is unknown, attempting token lookup for:', originalMessage.senderToken);
          try {
            const senderToken = await AuthTokenModel.findOne({ token: originalMessage.senderToken });
            if (senderToken) {
              senderUid = senderToken.uid;
              console.log('Successfully resolved senderUid from token:', senderUid);
              
              // Update the flagged message record with the correct senderUid
              flaggedMessage.senderUid = senderUid;
            } else {
              console.log('Token not found during fallback lookup');
            }
          } catch (tokenError) {
            console.error('Error during fallback token lookup:', tokenError);
          }
        }
        
        console.log(`Attempting to suspend sender with UID: ${senderUid}`);
        const sender = await UserModel.findOne({ uid: senderUid });
        
        if (sender) {
          console.log(`Found sender user: ${sender.uid} (${sender.email})`);
          sender.isSuspended = true;
          await sender.save();
          console.log(`Successfully suspended user: ${sender.uid}`);

          // Log user suspension
          await new AuditLogModel({
            actionType: ACTION_TYPES.USER_SUSPENDED,
            targetId: sender.uid,
            metadata: {
              reason: note || 'Suspended due to flagged message',
              messageId,
              moderatorId: userId,
            },
          }).save();
        } else {
          console.error(`No user found with UID: ${senderUid}`);
          return res.status(400).json({ 
            error: `Cannot suspend user: sender not found (UID: ${senderUid})` 
          });
        }

        // Mark as action taken in flagged messages
        flaggedMessage.moderationStatus = 'approved'; // Consider it resolved
        flaggedMessage.moderatedBy = userId;
        flaggedMessage.moderatedAt = new Date();
        flaggedMessage.moderationNote = note || 'Sender suspended by moderator';
        
        // Update original message if it exists
        if (originalMessage) {
          originalMessage.isFlagged = {
            ...originalMessage.isFlagged,
            modUid: userId,
          };
          await originalMessage.save();
        }
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await flaggedMessage.save();

    // Log moderation action
    await new AuditLogModel({
      actionType: ACTION_TYPES.MESSAGE_MODERATED,
      targetId: messageId,
      metadata: {
        action,
        note,
        moderatorId: userId,
        flaggedMessageId: flaggedMessage._id,
      },
    }).save();

    return res.json({
      success: true,
      message: `Message ${action} successfully`,
    });
  } catch (error) {
    console.error('Error moderating message:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Suspend a user
export const suspendUser = async (req, res) => {
  try {
    const moderatorId = req.user.uid;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify moderator status
    const moderator = await UserModel.findOne({
      uid: moderatorId,
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
    });

    if (!moderator) {
      return res
        .status(403)
        .json({ error: "You do not have permission to suspend users" });
    }

    // Find the user to suspend
    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't suspend admins
    if (user.role === ROLES.ADMIN) {
      return res.status(403).json({ error: "Cannot suspend administrators" });
    }

    // Set suspension status
    user.isSuspended = true;
    await user.save();

    // Log user suspension
    await new AuditLogModel({
      actionType: ACTION_TYPES.USER_SUSPENDED,
      targetId: userId,
      metadata: {
        reason: reason || "Suspended by moderator",
        moderatorId,
      },
    }).save();

    return res.json({
      success: true,
      message: "User suspended successfully",
    });
  } catch (error) {
    console.error("Error suspending user:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Set moderator public key (for encrypting flagged messages)
export const setModeratorPublicKey = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({ error: "Public key is required" });
    }

    // Verify user is a moderator
    const moderator = await UserModel.findOne({
      uid: userId,
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
    });

    if (!moderator) {
      return res.status(403).json({
        error: "You do not have permission to set moderator public key",
      });
    }

    // Store the public key in the moderator's profile
    moderator.moderatorPublicKey = publicKey;
    moderator.moderatorPublicKeyUpdatedAt = new Date();
    await moderator.save();

    // Log public key update
    await new AuditLogModel({
      actionType: ACTION_TYPES.MODERATOR_KEY_UPDATED,
      targetId: userId,
      metadata: {
        moderatorId: userId,
        action: "public_key_updated",
      },
    }).save();

    return res.json({
      success: true,
      message: "Moderator public key updated successfully",
    });
  } catch (error) {
    console.error("Error setting moderator public key:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Get moderator public key (for encrypting flagged messages)
export const getModeratorPublicKey = async (req, res) => {
  try {
    // Find any moderator with a public key
    const moderator = await UserModel.findOne({
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
      moderatorPublicKey: { $exists: true, $ne: null },
    });

    if (!moderator || !moderator.moderatorPublicKey) {
      return res.status(404).json({
        error:
          "No moderator public key found. Please contact the moderator to set up their key pair.",
      });
    }

    return res.json({
      success: true,
      publicKey: moderator.moderatorPublicKey,
      updatedAt: moderator.moderatorPublicKeyUpdatedAt,
    });
  } catch (error) {
    console.error("Error getting moderator public key:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
