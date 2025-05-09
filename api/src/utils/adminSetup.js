import readline from 'readline';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import UserModel, { ROLES } from '../models/user_model';
import { nanoid } from 'nanoid';

dotenv.config();

// Create interface for command line input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promise-based question function
const question = (query) => new Promise((resolve) => {
  rl.question(query, resolve);
});

// Generate a secure random password
const generateRandomPassword = () => {
  // Create a secure password with letters, numbers, and special characters
  const length = 16;
  return nanoid(length);
};

// Check if admin exists, if not, create one
const checkAndSetupAdmin = async () => {
  try {
    // Check if MongoDB is connected, if not, connect
    if (mongoose.connection.readyState !== 1) {
      const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost/whisperchain_db';
      await mongoose.connect(mongoURL);
      console.log('Connected to MongoDB for admin setup');
    }

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ role: ROLES.ADMIN });
    
    if (existingAdmin) {
      console.log('Admin account already exists. Continuing startup...');
      if (rl.listenerCount('line')) {
        rl.close();
      }
      return;
    }

    console.log('No admin account found. Let\'s set up an admin account.');
    
    // Ask for admin email
    const email = await question('Enter admin email: ');
    
    // Ask for admin name
    const name = await question('Enter admin display name: ');
    
    // Ask if user wants to generate a password or enter their own
    const generatePassword = await question('Generate a random secure password? (y/n): ');
    
    let password;
    if (generatePassword.toLowerCase() === 'y') {
      password = generateRandomPassword();
      console.log(`Generated password: ${password}`);
      console.log('IMPORTANT: Save this password in a secure location!');
    } else {
      // Ask for password with minimum length validation
      let validPassword = false;
      let attemptedPassword = '';
      while (!validPassword) {
        attemptedPassword = await question('Enter admin password (min 8 characters): ');
        if (attemptedPassword.length < 8) {
          console.log('Password must be at least 8 characters long.');
        } else {
          validPassword = true;
        }
      }
      password = attemptedPassword;
    }

    // Generate a unique user ID
    const uid = nanoid(16);

    // Create new admin user
    const admin = new UserModel({
      uid,
      email,
      name,
      password,
      role: ROLES.ADMIN,
      roleHistory: [{ role: ROLES.ADMIN, changedAt: new Date() }],
      accountCreatedAt: new Date(),
      isEmailVerified: true
    });

    await admin.save();

    console.log('Admin account created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);

    if (generatePassword.toLowerCase() === 'y') {
      console.log(`Password: ${password}`);
      console.log('IMPORTANT: This is the last time the password will be displayed. Please save it securely!');
    }

    // Close readline interface
    rl.close();

} catch (error) {
    console.error('Error setting up admin account:', error.message);
    rl.close();
    process.exit(1);
  }
};

// Allow this to be run directly
if (require.main === module) {
  checkAndSetupAdmin();
}

export default checkAndSetupAdmin; 