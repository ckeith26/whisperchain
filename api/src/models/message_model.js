import mongoose, { Schema } from "mongoose";

// Message schema for encrypted messages
const MessageSchema = new Schema(
  {
    messageId: { type: String, required: true, unique: true },
    content: { type: String, required: true }, // Encrypted message content for recipient
    moderatorContent: { type: String, required: true }, // Encrypted message content for moderators
    senderToken: { type: String, required: true, ref: "AuthToken" },
    recipientUid: { type: String, required: true, ref: "User" },
    sentAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }, // Track if message has been read
    isFlagged: {
      status: { type: Boolean, default: false },
      timestamp: { type: Date },
      modUid: { type: String, ref: "User" },
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Create model class
const MessageModel = mongoose.model("Message", MessageSchema);

export default MessageModel;
