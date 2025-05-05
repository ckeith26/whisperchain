import { Router } from 'express';

// WhisperChain+ imports
import * as AdminController from './controllers/admin_controller';
import * as AuthController from './controllers/auth_controller';
import * as MessageController from './controllers/message_controller';
import * as ModeratorController from './controllers/moderator_controller';
import { 
  requireAuth, 
  requireAdmin, 
  requireModerator, 
  requireRole 
} from './services/auth_service';
import { ROLES } from './models/user_model';

const router = Router();

// Default route
router.route('/')
  .get(async (req, res) => {
    res.json({ welcome: 'WhisperChain+ API' });
  });

// WhisperChain+ Routes

// Admin routes
router.route('/admin/setup')
  .post(AdminController.setupAdmin);

// Admin login - deprecated, use normal /auth/login
// Keeping for backward compatibility
router.route('/admin/login')
  .post(AdminController.adminLogin);

router.route('/admin/assignRole')
  .post(requireAuth, requireAdmin, AdminController.assignRole);

router.route('/admin/startRound')
  .post(requireAuth, requireAdmin, AdminController.startRound);

router.route('/admin/endRound')
  .post(requireAuth, requireAdmin, AdminController.endRound);

router.route('/admin/pendingUsers')
  .get(requireAuth, requireAdmin, AdminController.getPendingUsers);

// Auth routes
router.route('/auth/register')
  .post(AuthController.register);

router.route('/auth/login')
  .post(AuthController.login);

router.route('/auth/profile')
  .get(requireAuth, AuthController.getUserProfile);

router.route('/auth/generateKeyPair')
  .post(requireAuth, AuthController.generateKeyPair);

router.route('/auth/searchUsers')
  .get(requireAuth, requireRole(ROLES.SENDER), AuthController.searchUsers);

// Message routes
router.route('/messages/send')
  .post(MessageController.sendMessage);

router.route('/messages')
  .get(requireAuth, requireRole(ROLES.RECIPIENT), MessageController.getMessages);

router.route('/messages/flag')
  .post(requireAuth, requireRole(ROLES.RECIPIENT), MessageController.flagMessage);

// Moderator routes
router.route('/moderator/flaggedMessages')
  .get(requireAuth, requireModerator, ModeratorController.getFlaggedMessages);

router.route('/moderator/freezeToken')
  .post(requireAuth, requireModerator, ModeratorController.freezeToken);

router.route('/moderator/auditLogs')
  .get(requireAuth, requireModerator, ModeratorController.getAuditLogs);

export default router;

// router.route('/signout')
//    .post(oldRequireAuth, async (req, res) => {
//      await UserController.signout(req, res);
//    });

// ##################### implement STRIPE #####################
// Stripe webhook integration code remains commented out.

// const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
// router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
//   const signature = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripeClient.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;
//     const userId = session.metadata.userId;
//     const user = await User.findById(userId);
//     user.subscription.plan = session.metadata.planId;
//     user.subscription.status = 'active';
//     user.subscription.startDate = new Date();
//     const endDate = new Date();
//     endDate.setDate(endDate.getDate() + 30);
//     user.subscription.endDate = endDate;
//     await user.save();
//   }

//   res.json({ received: true });
// });


