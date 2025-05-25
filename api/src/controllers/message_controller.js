import { nanoid } from "nanoid";
import UserModel, { ROLES } from "../models/user_model.js";
import MessageModel from "../models/message_model.js";
import AuthTokenModel from "../models/auth_token_model.js";
import AuditLogModel, { ACTION_TYPES } from "../models/audit_log_model.js";
import FlaggedMessageModel from '../models/flagged_message_model.js';
import { encryptWithServerKey } from '../utils/crypto.js';

// Send a message with authentication token
export const sendMessage = async (req, res) => {
  try {
    const { recipientUid, encryptedMessage } = req.body;
    if (!recipientUid || !encryptedMessage) {
      return res.status(400).json({
        error: "Recipient ID and message content are required",
      });
    }

    // Get sender user ID from auth token
    const uid = req.user?.uid;
    if (!uid) {
      return res
        .status(401)
        .json({ error: "Authentication required to send messages" });
    }

    // Verify sender has permission to send messages
    const sender = await UserModel.findOne({ uid });
    if (
      !sender ||
      (sender.role !== ROLES.USER && sender.role !== ROLES.ADMIN)
    ) {
      return res
        .status(403)
        .json({ error: "You do not have permission to send messages" });
    }

    // Verify recipient exists
    const recipient = await UserModel.findOne({ uid: recipientUid });
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Create a message token
    const authToken = `msg_${Date.now()}_${nanoid(10)}`;

    // Create token record
    const tokenDoc = new AuthTokenModel({
      uid,
      token: authToken,
      issuedAt: new Date(),
      isUsed: true, // Mark as used immediately
    });
    await tokenDoc.save();

    // Create a new message
    const messageId = nanoid(16);
    const message = new MessageModel({
      messageId,
      content: encryptedMessage,
      senderToken: authToken,
      recipientUid,
      sentAt: new Date(),
    });

    await message.save();

    // Add message to sender and recipient records
    sender.sentMessages.push(message._id);
    await sender.save();

    recipient.receivedMessages.push(message._id);
    await recipient.save();

    // Log message send action
    await new AuditLogModel({
      actionType: ACTION_TYPES.MESSAGE_SENT,
      tokenId: authToken,
      targetId: recipientUid,
    }).save();

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      messageId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get messages for a recipient
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.uid;
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = page * limit;

    // Verify user has user permissions
    const user = await UserModel.findOne({ uid: userId });
    if (!user || (user.role !== ROLES.USER && user.role !== ROLES.ADMIN)) {
      return res
        .status(403)
        .json({ error: "You do not have permission to receive messages" });
    }

    // Find messages sent to this user with pagination
    const messages = await MessageModel.find({
      recipientUid: userId,
    })
      .sort({ sentAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const totalCount = await MessageModel.countDocuments({
      recipientUid: userId,
    });

    // Log message retrieval
    if (messages.length > 0) {
      await new AuditLogModel({
        actionType: ACTION_TYPES.MESSAGE_READ,
        targetId: userId,
      }).save();
    }

    return res.json({
      success: true,
      messages: messages.map((msg) => ({
        messageId: msg.messageId,
        content: msg.content, // Encrypted content
        sentAt: msg.sentAt,
        isRead: msg.isRead,
        flagged: msg.isFlagged.status, // Include flagged status in the response
      })),
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: skip + messages.length < totalCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Flag a message for review by moderators
export const flagMessage = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { messageId, unflag, moderatorContent } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Verify user has permission to flag messages
    const user = await UserModel.findOne({ uid: userId });
    if (!user || (user.role !== ROLES.USER)) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to flag messages' });
    }

    // Find the original message
    const message = await MessageModel.findOne({ messageId });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify the user is the recipient of this message
    if (message.recipientUid !== userId) {
      return res
        .status(403)
        .json({ error: 'You can only flag messages sent to you' });
    }

    if (unflag) {
      // Remove from flagged messages collection
      const existingFlaggedMessage = await FlaggedMessageModel.findOne({ 
        originalMessageId: messageId,
        flaggedBy: userId 
      });
      
      if (existingFlaggedMessage) {
        await FlaggedMessageModel.deleteOne({ _id: existingFlaggedMessage._id });
        
        // Update original message flag status
        message.isFlagged = {
          status: false,
          timestamp: null,
          modUid: null,
        };
        await message.save();

        // Log unflagging action
        await new AuditLogModel({
          actionType: ACTION_TYPES.MESSAGE_UNFLAGGED,
          targetId: messageId,
        }).save();

        return res.json({
          success: true,
          message: 'Message flag removed',
        });
      } else {
        return res.status(404).json({ error: 'Flagged message not found' });
      }
    } else {
      // Check if already flagged by this user
      const existingFlaggedMessage = await FlaggedMessageModel.findOne({ 
        originalMessageId: messageId,
        flaggedBy: userId 
      });
      
      if (existingFlaggedMessage) {
        return res.status(400).json({ error: 'Message already flagged' });
      }

      // Encrypt the moderator content with server key
      if (!moderatorContent) {
        return res.status(400).json({ 
          error: 'Message content is required for flagging' 
        });
      }
      
      let serverEncryptedContent;
      try {
        serverEncryptedContent = encryptWithServerKey(moderatorContent);
      } catch (error) {
        console.error('Error encrypting moderator content:', error);
        return res.status(500).json({ 
          error: 'Failed to encrypt message content for moderators. Please try again.' 
        });
      }

      // Create new flagged message entry
      const flaggedMessage = new FlaggedMessageModel({
        originalMessageId: messageId,
        senderUid: message.senderUid || 'unknown', // Get from token lookup if needed
        recipientUid: message.recipientUid,
        serverEncryptedContent,
        flaggedBy: userId,
        originalSentAt: message.sentAt,
        moderationStatus: 'pending',
      });

      await flaggedMessage.save();

      // Update original message flag status
      message.isFlagged = {
        status: true,
        timestamp: new Date(),
        modUid: null, // Will be updated when a moderator reviews it
      };
      await message.save();

      // Log flagging action
      await new AuditLogModel({
        actionType: ACTION_TYPES.MESSAGE_FLAGGED,
        targetId: messageId,
      }).save();

      return res.json({
        success: true,
        message: 'Message flagged for review',
        flaggedMessageId: flaggedMessage._id,
      });
    }
  } catch (error) {
    console.error('Error flagging message:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get sent messages for a user
export const getSentMessages = async (req, res) => {
  try {
    const userId = req.user.uid;
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = page * limit;

    // Verify user has user permissions
    const user = await UserModel.findOne({ uid: userId });
    if (!user || (user.role !== ROLES.USER && user.role !== ROLES.ADMIN)) {
      return res
        .status(403)
        .json({ error: "You do not have permission to access sent messages" });
    }

    // Find tokens created by this user
    const tokens = await AuthTokenModel.find({ uid: userId }).distinct("token");

    // Find messages sent by this user using those tokens with pagination
    const messages = await MessageModel.find({
      senderToken: { $in: tokens },
    })
      .sort({ sentAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const totalCount = await MessageModel.countDocuments({
      senderToken: { $in: tokens },
    });

    // Get recipient information for each message
    const enhancedMessages = await Promise.all(
      messages.map(async (msg) => {
        const recipient = await UserModel.findOne({ uid: msg.recipientUid });
        return {
          messageId: msg.messageId,
          content: msg.content,
          sentAt: msg.sentAt,
          recipient: recipient
            ? {
                uid: recipient.uid,
                name: recipient.name,
                email: recipient.email,
              }
            : { name: "Unknown User" },
        };
      })
    );

    return res.json({
      success: true,
      messages: enhancedMessages,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: skip + messages.length < totalCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get unread message count
export const getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Verify user has permission
    const user = await UserModel.findOne({ uid: userId });
    if (!user || (user.role !== ROLES.USER && user.role !== ROLES.ADMIN)) {
      return res
        .status(403)
        .json({ error: "You do not have permission to access messages" });
    }

    // Count unread messages
    const count = await MessageModel.countDocuments({
      recipientUid: userId,
      isRead: false,
    });

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Verify user has permission
    const user = await UserModel.findOne({ uid: userId });
    if (!user || (user.role !== ROLES.USER && user.role !== ROLES.ADMIN)) {
      return res
        .status(403)
        .json({ error: "You do not have permission to access messages" });
    }

    // Mark all unread messages for this user as read
    const result = await MessageModel.updateMany(
      { recipientUid: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({
      success: true,
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
