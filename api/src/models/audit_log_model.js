import mongoose, { Schema } from 'mongoose';

// Define audit action types
const ACTION_TYPES = {
  USER_CREATED: 'user_created',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_SUSPENDED: 'user_suspended',
  USER_UNSUSPENDED: 'user_unsuspended',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  MESSAGE_FLAGGED: 'message_flagged',
  MESSAGE_UNFLAGGED: 'message_unflagged',
  MESSAGE_MODERATED: 'message_moderated',
  TOKEN_FROZEN: 'token_frozen',
};

// Audit Log schema for logging all system actions
const AuditLogSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  actionType: { type: String, required: true, enum: Object.values(ACTION_TYPES) },
  role: { type: String },
  tokenId: { type: String, ref: 'AuthToken' },
  targetId: { type: String }, // User ID, Message ID, etc.
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

// Create model class
const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);

export { ACTION_TYPES };
export default AuditLogModel;
