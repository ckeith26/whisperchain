import { Router } from 'express';

// WhisperChain+ imports
import * as AdminController from './controllers/admin_controller';
import * as AuthController from './controllers/auth_controller';
import * as MessageController from './controllers/message_controller';
import * as ModeratorController from './controllers/moderator_controller';
import * as CryptoController from './controllers/crypto_controller';
import {
  requireAuth,
  requireAdmin,
  requireModerator,
  requireRole,
} from './services/auth_service';
import { ROLES } from './models/user_model';

const router = Router();

// Default route
router.route('/').get(async (req, res) => {
  res.json({ welcome: 'WhisperChain+ API' });
});

// Health check endpoint for API connectivity detection
router.route('/health').get(async (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// WhisperChain+ Routes

// Admin routes
router.route('/admin/setup').post(AdminController.setupAdmin);

router
  .route('/admin/users')
  .get(requireAuth, requireAdmin, AdminController.getUsers);

// router
//   .route('/admin/toggleSuspension')
//   .post(requireAuth, requireAdmin, AdminController.toggleUserSuspension);

router
  .route('/admin/assignRole')
  .post(requireAuth, requireAdmin, AdminController.assignRole);

router
  .route('/admin/pendingUsers')
  .get(requireAuth, requireAdmin, AdminController.getPendingUsers);

router
  .route('/admin/rejectUser')
  .post(requireAuth, requireAdmin, AdminController.rejectUser);

router
  .route('/admin/stats')
  .get(requireAuth, requireAdmin, AdminController.getDashboardStats);

router
  .route('/admin/makeModeratorIdle')
  .post(requireAuth, requireAdmin, AdminController.makeModeratorIdle);

router
  .route('/admin/reactivateModerator')
  .post(requireAuth, requireAdmin, AdminController.reactivateModerator);

// Auth routes
router.route('/auth/register').post(AuthController.register);

router.route('/auth/login').post(AuthController.login);

router.route('/auth/profile').get(requireAuth, AuthController.getUserProfile);

router
  .route('/auth/generateKeyPair')
  .post(requireAuth, AuthController.generateKeyPair);

router
  .route('/auth/searchUsers')
  .get(requireAuth, requireRole(ROLES.USER), AuthController.searchUsers);

// Message routes
router
  .route('/messages/send')
  .post(requireAuth, requireRole(ROLES.USER), MessageController.sendMessage);

router
  .route('/messages')
  .get(requireAuth, requireRole(ROLES.USER), MessageController.getMessages);

router
  .route('/messages/sent')
  .get(requireAuth, requireRole(ROLES.USER), MessageController.getSentMessages);

router
  .route('/messages/flag')
  .post(requireAuth, requireRole(ROLES.USER), MessageController.flagMessage);

router
  .route('/messages/markAsRead')
  .post(
    requireAuth,
    requireRole(ROLES.USER),
    MessageController.markMessagesAsRead
  );

router
  .route('/messages/unread/count')
  .get(
    requireAuth,
    requireRole(ROLES.USER),
    MessageController.getUnreadMessageCount
  );

// Moderator routes
router
  .route('/moderator/flaggedMessages')
  .get(requireAuth, requireModerator, ModeratorController.getFlaggedMessages);

router
  .route('/moderator/flagged/count')
  .get(
    requireAuth,
    requireModerator,
    ModeratorController.getFlaggedMessageCount,
  );

router
  .route('/moderator/moderateMessage')
  .post(requireAuth, requireModerator, ModeratorController.moderateMessage);

router
  .route('/moderator/freezeToken')
  .post(requireAuth, requireModerator, ModeratorController.freezeToken);

router
  .route('/moderator/auditLogs')
  .get(requireAuth, requireModerator, ModeratorController.getAuditLogs);

// Moderator public key routes
router
  .route('/moderator/public-key')
  .post(
    requireAuth,
    requireModerator,
    ModeratorController.setModeratorPublicKey,
  )
  .get(requireAuth, ModeratorController.getModeratorPublicKey);

// Crypto routes (public endpoints for key exchange)
router.route('/crypto/serverPublicKey').get(CryptoController.getServerPublicKey);

export default router;
