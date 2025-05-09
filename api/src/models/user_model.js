import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Define user roles
const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  IDLE: 'idle',
};

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, 'Email is required'],
      validate: {
        validator(v) {
          return /^((?!.*\.\.)[A-Za-z0-9!#$%&'*+-/=?^_`{|}~]+(\.[A-Za-z0-9!#$%&'*+-/=?^_`{|}~]+)*|"([^"]*)")@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    password: {
      type: String,
      select: false,
    },
    username: {
      type: String,
      unique: true,
    },
    // Account security and management
    isEmailVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    // Profile information
    firstName: { type: String },
    lastName: { type: String },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.IDLE,
    },

    passwordChangedAt: { type: Date },
    emailVerifiedAt: { type: Date, default: null },
    lastVerificationEmailSentAt: { type: Date, default: null },
    lastResetPasswordEmailSentAt: { type: Date, default: null },
    isNewAccount: { type: Boolean, default: true },
    roleVerifiedAt: { type: Date, default: null },

    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    publicKey: { type: String },
    sentMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    receivedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    accountCreatedAt: { type: Date, default: Date.now },
    roleHistory: [{
      role: { type: String, enum: Object.values(ROLES) },
      changedAt: { type: Date, default: Date.now },
      verifiedAt: { type: Date, default: null },
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    }],
    isSuspended: { type: Boolean, default: false },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

// Hash password if provided and modified
UserSchema.pre('save', async function (next) {
  const user = this;
  // If password is not modified or doesn't exist, skip hashing
  if (!user.isModified('password') || !user.password) return next();

  try {
    console.log('Hashing password for user:', user.email);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    user.password = hashedPassword;
    next();
  } catch (err) {
    console.error('Error hashing password:', err.message);
    next(new Error(`Error hashing password: ${err.message}`));
  }
});

// Generate a unique username if not provided
UserSchema.pre('save', async function (next) {
  if (this.username) return next();

  const baseUsernameRaw = this.email.split('@')[0];
  const baseUsername = baseUsernameRaw.replace(/[^a-zA-Z0-9_-]/g, '');
  
  let generatedUsername = baseUsername;
  let counter = 0;
  let usernameExists = true;

  while (usernameExists) {
    const existingUser = await this.constructor.findOne({ username: generatedUsername });
    if (!existingUser) {
      usernameExists = false;
    } else {
      counter += 1;
      generatedUsername = `${baseUsername}${counter}`;
    }
  }

  this.username = generatedUsername;
  next();
});

UserSchema.virtual('chats', {
  ref: 'Chat',
  localField: '_id',
  foreignField: 'user',
  justOne: false,
});

UserSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'user',
  justOne: false,
});

// Compare password during login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      console.error('Password field is not set for user:', this.email);
      throw new Error('Password field is not set. Include password in query.');
    }    
    const result = await bcrypt.compare(candidatePassword, this.password);

    return result;
  } catch (err) {
    console.error('Error in comparePassword:', err.message);
    throw new Error(`Error comparing passwords: ${err.message}`);
  }
};

// Generate a salt and hash a password
UserSchema.methods.generateHash = async function generateHash(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  this.password = hash;
  return hash;
};

// Update the user's role
UserSchema.methods.updateRole = function updateRole(role) {
  this.roleHistory.push({
    role: this.role,
    changedAt: new Date()
  });
  this.role = role;
};

const UserModel = mongoose.model('User', UserSchema);

export { ROLES };
export default UserModel;
