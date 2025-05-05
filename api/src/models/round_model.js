import mongoose, { Schema } from 'mongoose';

// System round schema for tracking message rounds
const RoundSchema = new Schema({
  roundNumber: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, default: false },
  startedAt: { type: Date },
  endedAt: { type: Date },
  createdBy: { type: String, ref: 'User' },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

// Create model class
const RoundModel = mongoose.model('Round', RoundSchema);

export default RoundModel; 