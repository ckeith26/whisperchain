import mongoose from 'mongoose';

const { Schema } = mongoose;

const verificationCodeSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  code: {
    type: String,
    required: true,
    length: 6,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Automatically delete after 5 minutes
  },
});

const VerificationCodeModel = mongoose.model('VerificationCode', verificationCodeSchema);

export default VerificationCodeModel;
