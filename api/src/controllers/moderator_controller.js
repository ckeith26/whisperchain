import dotenv from "dotenv";
import UserModel, { ROLES } from "../models/user_model";
import MessageModel from "../models/message_model";
import AuthTokenModel from "../models/auth_token_model";
import AuditLogModel, { ACTION_TYPES } from "../models/audit_log_model";

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
        error: "You do not have permission to access flagged messages",
      });
    }

    // Find flagged messages with pagination
    const flaggedMessages = await MessageModel.find({
      "isFlagged.status": true,
    })
      .sort({ "isFlagged.timestamp": -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await MessageModel.countDocuments({
      "isFlagged.status": true,
    });

    // Get user info for each message's sender and recipient
    const enhancedMessages = await Promise.all(
      flaggedMessages.map(async (msg) => {
        const recipient = await UserModel.findOne({ uid: msg.recipientUid });

        // Get sender info from token
        let senderUid = "Unknown";
        if (msg.senderToken) {
          const authToken = await AuthTokenModel.findOne({
            token: msg.senderToken,
          });
          if (authToken) {
            senderUid = authToken.uid;
          }
        }

        return {
          messageId: msg.messageId,
          content: msg.content,
          moderatorContent: msg.moderatorContent,
          sentAt: msg.sentAt,
          flaggedAt: msg.isFlagged.timestamp,
          senderUid,
          senderToken: msg.senderToken,
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
        hasMore: skip + enhancedMessages.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error getting flagged messages:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Freeze a token associated with a message
export const freezeToken = async (req, res) => {
  try {
    const moderatorId = req.user.uid;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Verify moderator permissions
    const moderator = await UserModel.findOne({ uid: moderatorId });
    if (!moderator || moderator.role !== ROLES.MODERATOR) {
      return res
        .status(403)
        .json({ error: "You do not have permission to freeze tokens" });
    }

    // Find and freeze the token
    const tokenDoc = await AuthTokenModel.findOne({ token });
    if (!tokenDoc) {
      return res.status(404).json({ error: "Token not found" });
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
      message: "Token frozen successfully",
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
        .json({ error: "You do not have permission to view audit logs" });
    }

    // Parse query parameters for filtering
    const { actionType, startDate, endDate, limit = 100 } = req.query;

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

// Get flagged message count
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
        error: "You do not have permission to access flagged message count",
      });
    }

    // Count flagged messages
    const count = await MessageModel.countDocuments({
      "isFlagged.status": true,
    });

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error getting flagged message count:", error.message);
    return res.status(500).json({ error: error.message });
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
        .json({ error: "Message ID and action are required" });
    }

    // Verify moderator status
    const moderator = await UserModel.findOne({
      uid: userId,
      $or: [{ role: ROLES.MODERATOR }, { role: ROLES.ADMIN }],
    });

    if (!moderator) {
      return res
        .status(403)
        .json({ error: "You do not have permission to moderate messages" });
    }

    // Find the message
    const message = await MessageModel.findOne({ messageId });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Handle different actions
    switch (action) {
      case "approve":
        // Clear flag and leave a note
        message.isFlagged = {
          status: false,
          timestamp: null,
          modUid: userId,
          note: note || "Approved by moderator",
        };
        break;
      case "reject":
        // Mark as rejected but keep flag
        message.isFlagged = {
          status: true,
          timestamp: message.isFlagged.timestamp,
          modUid: userId,
          note: note || "Rejected by moderator",
          action: "rejected",
        };
        break;
      case "suspend_sender": {
        // Find the sender and suspend them
        const { senderToken } = message;
        const authToken = await AuthTokenModel.findOne({ token: senderToken });

        if (authToken) {
          const sender = await UserModel.findOne({ uid: authToken.uid });
          if (sender) {
            sender.isSuspended = true;
            await sender.save();

            // Log user suspension
            await new AuditLogModel({
              actionType: ACTION_TYPES.USER_SUSPENDED,
              targetId: sender.uid,
              metadata: {
                reason: note || "Suspended due to flagged message",
                messageId,
                moderatorId: userId,
              },
            }).save();
          }
        }

        message.isFlagged = {
          ...message.isFlagged,
          modUid: userId,
          note: note || "Sender suspended by moderator",
          action: "suspended_sender",
        };
        break;
      }
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    await message.save();

    // Log moderation action
    await new AuditLogModel({
      actionType: ACTION_TYPES.MESSAGE_MODERATED,
      targetId: messageId,
      metadata: {
        action,
        note,
        moderatorId: userId,
      },
    }).save();

    return res.json({
      success: true,
      message: `Message ${action} successfully`,
    });
  } catch (error) {
    console.error("Error moderating message:", error.message);
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

// Add this new function to your existing moderator_controller.js
export const testAuditLogProtection = async (req, res) => {
  try {
    const results = {
      insert: null,
      update: null,
      delete: null,
      verify: null,
    };

    // 1. Test insertion (should work)
    try {
      const newLog = await AuditLogModel.create({
        actionType: ACTION_TYPES.USER_CREATED,
        targetId: "test123",
        metadata: { test: true },
      });
      results.insert = "✅ Successfully created new log";

      // Save the ID for later tests
      const logId = newLog._id;

      // 2. Test update (should fail)
      try {
        await AuditLogModel.updateOne(
          { _id: logId },
          { $set: { metadata: { modified: true } } }
        );
        results.update = "❌ Update succeeded when it should have failed";
      } catch (error) {
        results.update = `✅ Update blocked as expected: ${error.message}`;
      }

      // 3. Test deletion (should fail)
      try {
        await AuditLogModel.deleteOne({ _id: logId });
        results.delete = "❌ Deletion succeeded when it should have failed";
      } catch (error) {
        results.delete = `✅ Deletion blocked as expected: ${error.message}`;
      }

      // 4. Verify the log is unchanged
      const verifyLog = await AuditLogModel.findById(logId);
      results.verify =
        verifyLog.metadata.test === true
          ? "✅ Log remains unchanged"
          : "❌ Log was modified";
    } catch (error) {
      results.insert = `❌ Creation failed: ${error.message}`;
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add these new routes to test audit log protection

// Create a test log
export const createTestLog = async (req, res) => {
  try {
    // Validate the required fields
    if (!req.body.actionType || !req.body.targetId) {
      return res.status(400).json({
        error: "actionType and targetId are required",
      });
    }

    // Make sure actionType is valid
    if (!Object.values(ACTION_TYPES).includes(req.body.actionType)) {
      return res.status(400).json({
        error: "Invalid actionType",
      });
    }

    // Create the log using the model
    const log = new AuditLogModel({
      actionType: req.body.actionType,
      targetId: req.body.targetId,
      metadata: req.body.metadata || {},
      timestamp: new Date(),
    });

    // Save the log
    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (error) {
    console.error("Error creating test log:", error);
    res.status(500).json({ error: error.message });
  }
};

// Try to modify a log
export const updateTestLog = async (req, res) => {
  try {
    const log = await AuditLogModel.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );
    res.json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Try to delete a log
export const deleteTestLog = async (req, res) => {
  try {
    const log = await AuditLogModel.deleteOne({ _id: req.params.id });
    res.json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a specific log
export const getTestLog = async (req, res) => {
  try {
    const log = await AuditLogModel.findById(req.params.id);
    res.json(log);
  } catch (error) {
    res.status(404).json({ error: error.message });
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
