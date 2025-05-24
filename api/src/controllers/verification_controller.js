import VerificationCodeModel from '../models/verification_code_model.js';
import UserModel from '../models/user_model.js';
import sendVerificationEmail from '../services/email_service.js';

// Helper function to calculate time remaining
const calculateTimeRemaining = (expiryDate) => {
  const now = new Date();
  const expiryTime = new Date(expiryDate);
  const diffMs = expiryTime - now;
  
  if (diffMs <= 0) return { minutes: 0, seconds: 0 };
  
  const diffSecs = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffSecs / 60);
  const seconds = diffSecs % 60;
  
  return { minutes, seconds };
};

// Send verification code
export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if there's an unexpired and unused code
    const existingCode = await VerificationCodeModel.findOne({
      email,
      isUsed: false,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Less than 5 minutes old
    });

    if (existingCode) {
      // Calculate time remaining before a new code can be requested
      const expiryTime = new Date(existingCode.createdAt.getTime() + 5 * 60 * 1000);
      const { minutes, seconds } = calculateTimeRemaining(expiryTime);
      
      return res.status(429).json({
        error: 'A verification code has already been sent',
        timeRemaining: { minutes, seconds },
        message: `Please wait ${minutes}m ${seconds}s before requesting a new code`,
      });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save the code
    const verificationCode = new VerificationCodeModel({
      email,
      code,
    });
    
    await verificationCode.save();
    
    // Send the code via email
    await sendVerificationEmail(email, code);
    
    return res.json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Verify the code
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find the verification code
    const verificationCode = await VerificationCodeModel.findOne({
      email,
      code,
      isUsed: false,
    });

    if (!verificationCode) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark the code as used
    verificationCode.isUsed = true;
    await verificationCode.save();

    // Update user's email verification status
    const user = await UserModel.findOne({ email });
    if (user) {
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();
    }

    return res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ error: error.message });
  }
}; 