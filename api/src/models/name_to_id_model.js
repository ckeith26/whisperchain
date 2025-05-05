import mongoose, { Schema } from 'mongoose';

// NameToId schema for mapping user names to their IDs
const NameToIdSchema = new Schema({
  name: { type: String, required: true, unique: true },
  uid: { type: String, required: true, unique: true, ref: 'User' }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

// Create model class
const NameToIdModel = mongoose.model('NameToId', NameToIdSchema);

export default NameToIdModel; 