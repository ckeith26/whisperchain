import mongoose, { Schema } from 'mongoose';

// Auth Token schema for one-time use tokens
const AuthTokenSchema = new Schema({
  uid: { type: String, required: true, ref: 'User' },
  token: { type: String, required: true, unique: true },
  issuedAt: { type: Date, default: Date.now },
  isUsed: { type: Boolean, default: false },
  isFrozen: {
    status: { type: Boolean, default: false },
    timestamp: { type: Date },
    modUid: { type: String, ref: 'User' }
  }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

// Create model class
const AuthTokenModel = mongoose.model('AuthToken', AuthTokenSchema);

export default AuthTokenModel; 