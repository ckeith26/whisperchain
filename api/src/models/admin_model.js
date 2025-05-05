import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Admin schema for system administration
const AdminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

// Generate a salt and hash a password
AdminSchema.methods.generateHash = async function generateHash(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  this.password = hash;
  this.salt = salt;
  return hash;
};

// Check the password against the hashed password
AdminSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

// Create model class
const AdminModel = mongoose.model('Admin', AdminSchema);

export default AdminModel; 