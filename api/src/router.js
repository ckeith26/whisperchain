import { Router } from "express";

// WhisperChain+ imports
import * as AdminController from "./controllers/admin_controller";
import * as AuthController from "./controllers/auth_controller";
import * as MessageController from "./controllers/message_controller";
import * as ModeratorController from "./controllers/moderator_controller";
import {
  requireAuth,
  requireAdmin,
  requireModerator,
  requireRole,
} from "./services/auth_service";
import { ROLES } from "./models/user_model";

const router = Router();

// Default route
router.route("/").get(async (req, res) => {
  res.json({ welcome: "WhisperChain+ API" });
});

// Health check endpoint for API connectivity detection
router.route("/health").get(async (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// WhisperChain+ Routes

// Admin routes
router.route("/admin/setup").post(AdminController.setupAdmin);

router
  .route("/admin/users")
  .get(requireAuth, requireAdmin, AdminController.getUsers);

router
  .route("/admin/toggleSuspension")
  .post(requireAuth, requireAdmin, AdminController.toggleUserSuspension);

router
  .route("/admin/assignRole")
  .post(requireAuth, requireAdmin, AdminController.assignRole);

router
  .route("/admin/pendingUsers")
  .get(requireAuth, requireAdmin, AdminController.getPendingUsers);

router
  .route("/admin/stats")
  .get(requireAuth, requireAdmin, AdminController.getDashboardStats);

// Auth routes
router.route("/auth/register").post(AuthController.register);

router.route("/auth/login").post(AuthController.login);

router.route("/auth/profile").get(requireAuth, AuthController.getUserProfile);

router
  .route("/auth/generateKeyPair")
  .post(requireAuth, AuthController.generateKeyPair);

router
  .route("/auth/searchUsers")
  .get(requireAuth, requireRole(ROLES.USER), AuthController.searchUsers);

// Message routes
router
  .route("/messages/send")
  .post(requireAuth, requireRole(ROLES.USER), MessageController.sendMessage);

router
  .route("/messages")
  .get(requireAuth, requireRole(ROLES.USER), MessageController.getMessages);

router
  .route("/messages/sent")
  .get(requireAuth, requireRole(ROLES.USER), MessageController.getSentMessages);

router
  .route("/messages/flag")
  .post(requireAuth, requireRole(ROLES.USER), MessageController.flagMessage);

router
  .route("/messages/markAsRead")
  .post(
    requireAuth,
    requireRole(ROLES.USER),
    MessageController.markMessagesAsRead
  );

router
  .route("/messages/unread/count")
  .get(
    requireAuth,
    requireRole(ROLES.USER),
    MessageController.getUnreadMessageCount
  );

// Moderator routes
router
  .route("/moderator/flaggedMessages")
  .get(requireAuth, requireModerator, ModeratorController.getFlaggedMessages);

router
  .route("/moderator/flagged/count")
  .get(
    requireAuth,
    requireModerator,
    ModeratorController.getFlaggedMessageCount
  );

router
  .route("/moderator/moderateMessage")
  .post(requireAuth, requireModerator, ModeratorController.moderateMessage);

router
  .route("/moderator/suspendUser")
  .post(requireAuth, requireModerator, ModeratorController.suspendUser);

router
  .route("/moderator/freezeToken")
  .post(requireAuth, requireModerator, ModeratorController.freezeToken);

router
  .route("/moderator/auditLogs")
  .get(requireAuth, requireModerator, ModeratorController.getAuditLogs);

// Add this route to test audit log protection
router.get(
  "/moderator/test-audit-protection",
  requireAuth,
  requireModerator,
  ModeratorController.testAuditLogProtection
);

// Add these with your other moderator routes
router.post(
  "/moderator/auditLogs",
  requireAuth,
  requireModerator,
  ModeratorController.createTestLog
);
router.put(
  "/moderator/auditLogs/:id",
  requireAuth,
  requireModerator,
  ModeratorController.updateTestLog
);
router.delete(
  "/moderator/auditLogs/:id",
  requireAuth,
  requireModerator,
  ModeratorController.deleteTestLog
);
router.get(
  "/moderator/auditLogs/:id",
  requireAuth,
  requireModerator,
  ModeratorController.getTestLog
);

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

// router.get('/echo', (req, res) => {
//   res.json({ received: true });
// });
