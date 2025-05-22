import mongoose, { Schema } from "mongoose";

// Define audit action types
const ACTION_TYPES = {
  USER_CREATED: "user_created",
  USER_ROLE_CHANGED: "user_role_changed",
  USER_SUSPENDED: "user_suspended",
  USER_UNSUSPENDED: "user_unsuspended",
  MESSAGE_SENT: "message_sent",
  MESSAGE_READ: "message_read",
  MESSAGE_FLAGGED: "message_flagged",
  MESSAGE_UNFLAGGED: "message_unflagged",
  MESSAGE_MODERATED: "message_moderated",
  TOKEN_FROZEN: "token_frozen",
};

// Audit Log schema for logging all system actions
const AuditLogSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  actionType: {
    type: String,
    required: true,
    enum: Object.values(ACTION_TYPES),
  },
  role: { type: String },
  tokenId: { type: String, ref: "AuthToken" },
  targetId: { type: String }, // User ID, Message ID, etc.
  metadata: { type: Object },
});

// Simple pre-save hook to prevent modifications
AuditLogSchema.pre("save", function (next) {
  if (!this.isNew) {
    return next(new Error("Audit logs cannot be modified"));
  }
  next();
});

// Disable all update and delete operations
[
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "findOneAndUpdate",
  "findOneAndDelete",
].forEach((method) => {
  AuditLogSchema.static(method, async function () {
    throw new Error("Operation not allowed on audit logs");
  });
});

// Create model class
const AuditLogModel = mongoose.model("AuditLog", AuditLogSchema);

// Create a wrapper function for creating audit logs
export const createAuditLog = async (logData) => {
  try {
    const log = new AuditLogModel(logData);
    return await log.save();
  } catch (error) {
    console.error("Error creating audit log:", error);
    throw error;
  }
};

export { ACTION_TYPES };
export default AuditLogModel;
