import { nanoid } from 'nanoid';
import UserModel, { ROLES } from '../models/user_model';
import MessageModel from '../models/message_model';
import AuthTokenModel from '../models/auth_token_model';
import RoundModel from '../models/round_model';
import AuditLogModel, { ACTION_TYPES } from '../models/audit_log_model';

// Send a message with authentication token
export const sendMessage = async (req, res) => {
  try {
    const { authToken, recipientUid, encryptedMessage } = req.body;
    
    if (!authToken || !recipientUid || !encryptedMessage) {
      return res.status(400).json({ error: 'Auth token, recipient ID, and encrypted message are required' });
    }

    // Verify the auth token
    const tokenDoc = await AuthTokenModel.findOne({ token: authToken });
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Check if token has been used
    if (tokenDoc.isUsed) {
      return res.status(401).json({ error: 'This token has already been used' });
    }

    // Check if token is frozen
    if (tokenDoc.isFrozen.status) {
      return res.status(403).json({ error: 'This token has been frozen by a moderator' });
    }

    // Verify that there's an active round and it matches the token's round
    const activeRound = await RoundModel.findOne({ isActive: true });
    if (!activeRound) {
      return res.status(400).json({ error: 'No active message round' });
    }
    
    if (activeRound.roundNumber !== tokenDoc.round) {
      return res.status(401).json({ error: 'This token is not valid for the current round' });
    }

    // Verify sender has permission to send messages
    const sender = await UserModel.findOne({ uid: tokenDoc.uid });
    if (!sender || sender.role !== ROLES.SENDER) {
      return res.status(403).json({ error: 'You do not have permission to send messages' });
    }

    // Verify recipient exists
    const recipient = await UserModel.findOne({ uid: recipientUid });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create a new message
    const messageId = nanoid(16);
    const message = new MessageModel({
      messageId,
      content: encryptedMessage,
      senderToken: authToken,
      recipientUid,
      round: activeRound.roundNumber,
      sentAt: new Date()
    });

    await message.save();

    // Mark the token as used
    tokenDoc.isUsed = true;
    await tokenDoc.save();

    // Add message to sender and recipient records
    sender.sentMessages.push(message._id);
    await sender.save();

    recipient.receivedMessages.push(message._id);
    await recipient.save();

    // Log message send action (without revealing content)
    await new AuditLogModel({
      actionType: ACTION_TYPES.MESSAGE_SENT,
      tokenId: authToken,
      targetId: recipientUid,
      round: activeRound.roundNumber,
      metadata: { messageId }
    }).save();

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get messages for a recipient
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Verify user has recipient permissions
    const user = await UserModel.findOne({ uid: userId });
    if (!user || user.role !== ROLES.RECIPIENT) {
      return res.status(403).json({ error: 'You do not have permission to receive messages' });
    }

    // Get the latest completed round (where messages were sent)
    const latestRound = await RoundModel.findOne({ isActive: false }).sort({ roundNumber: -1 });
    if (!latestRound) {
      return res.status(404).json({ error: 'No completed rounds found' });
    }

    // Find messages sent to this user in the latest completed round
    const messages = await MessageModel.find({
      recipientUid: userId,
      round: latestRound.roundNumber
    });

    // Log message retrieval
    if (messages.length > 0) {
      await new AuditLogModel({
        actionType: ACTION_TYPES.MESSAGE_READ,
        targetId: userId,
        round: latestRound.roundNumber,
        metadata: { messageCount: messages.length }
      }).save();
    }

    return res.json({
      success: true,
      round: latestRound.roundNumber,
      messages: messages.map(msg => ({
        messageId: msg.messageId,
        content: msg.content, // Encrypted content
        sentAt: msg.sentAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Flag a message for review by moderators
export const flagMessage = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Find the message
    const message = await MessageModel.findOne({ messageId });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify the user is the recipient of this message
    if (message.recipientUid !== userId) {
      return res.status(403).json({ error: 'You can only flag messages sent to you' });
    }

    // Flag the message
    message.isFlagged = {
      status: true,
      timestamp: new Date(),
      modUid: null // Will be updated when a moderator reviews it
    };
    await message.save();

    // Log flagging action
    await new AuditLogModel({
      actionType: ACTION_TYPES.MESSAGE_FLAGGED,
      targetId: messageId,
      metadata: { flaggedBy: userId }
    }).save();

    return res.json({
      success: true,
      message: 'Message flagged for review'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 