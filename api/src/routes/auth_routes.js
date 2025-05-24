import express from 'express';
import {
  register, 
  login, 
  generateKeyPair, 
  searchUsers,
  getUserProfile,
} from '../controllers/auth_controller';
import { requireAuth } from '../services/auth_service';
import { 
  sendVerificationCode, 
  verifyCode 
} from '../controllers/verification_controller';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile', requireAuth, getUserProfile);

// Key management
router.post('/generate-key-pair', requireAuth, generateKeyPair);

// User search for recipients
router.get('/searchUsers', requireAuth, searchUsers);

// Verification routes
router.post('/send-verification', sendVerificationCode);
router.post('/verify-code', verifyCode);

export default router; 