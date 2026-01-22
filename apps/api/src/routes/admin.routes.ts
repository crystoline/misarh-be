import { Router } from 'express';
import {
    getAdminOrders,
    updateOrderStatus,
    getOrderStats,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Order Management
router.get('/orders', getAdminOrders);
router.get('/orders/stats', getOrderStats);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
