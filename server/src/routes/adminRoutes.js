import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../config/enums.js';

const router = Router();

// Apply authenticate and requireRole('ADMIN') across all admin endpoints
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/overview', adminController.getOverview);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.patch('/users/:id/reactivate', adminController.reactivateUser);
router.post('/users/:id/credit-adjustments', adminController.adjustCredits);
router.get('/reports', adminController.listReports);
router.patch('/reports/:id', adminController.resolveReport);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
