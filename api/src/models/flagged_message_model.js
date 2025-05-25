import mongoose from 'mongoose';

const flaggedMessageSchema = new mongoose.Schema(
  {
    // Reference to original message
    originalMessageId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Sender information
    senderUid: {
      type: String,
      required: true,
      index: true,
    },
    
    // Recipient information
    recipientUid: {
      type: String,
      required: true,
      index: true,
    },
    
    // Original message content encrypted with server's public key
    serverEncryptedContent: {
      type: String,
      required: true,
    },
    
    // Flagging information
    flaggedBy: {
      type: String, // UID of user who flagged it
      required: true,
    },
    
    flaggedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    // Original message timestamp
    originalSentAt: {
      type: Date,
      required: true,
    },
    
    // Moderation status
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'dismissed'],
      default: 'pending',
      index: true,
    },
    
    // Moderation action details
    moderatedBy: {
      type: String, // UID of moderator who took action
    },
    
    moderatedAt: {
      type: Date,
    },
    
    moderationNote: {
      type: String,
    },
    
    // Additional metadata
    metadata: {
      flagReason: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      tags: [String],
    },
  },
  {
    timestamps: true,
    collection: 'flaggedmessages',
  }
);

// Indexes for performance
flaggedMessageSchema.index({ flaggedAt: -1 });
flaggedMessageSchema.index({ moderationStatus: 1, flaggedAt: -1 });
flaggedMessageSchema.index({ senderUid: 1, flaggedAt: -1 });
flaggedMessageSchema.index({ recipientUid: 1, flaggedAt: -1 });

const FlaggedMessageModel = mongoose.model('FlaggedMessage', flaggedMessageSchema);

export default FlaggedMessageModel; 