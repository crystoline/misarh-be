import { Router } from 'express';
import {
    getAdminOrders,
    updateOrderStatus,
    getOrderStats,
    bulkUpdateOrderStatus,
    assignOrder,
    updateOrderPriority,
} from '../controllers/admin.controller';
import {
    getAdminConsultations,
    updateConsultationStatus,
    getAdminConsultationById,
    getAvailabilitySettings,
    updateAvailabilitySlot,
    recordFormula,
    getFormulas,
} from '../controllers/admin.consultation.controller';
import {
    getCustomers,
    getCustomerById,
    getAnalyticsOverview,
    getSalesAnalytics,
    exportOrders,
    exportCustomers,
} from '../controllers/admin.analytics.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==========================================
// Order Management
// ==========================================
router.get('/orders', getAdminOrders);
router.get('/orders/stats', getOrderStats);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/bulk-status', bulkUpdateOrderStatus);
router.put('/orders/:id/assign', assignOrder);
router.put('/orders/:id/priority', updateOrderPriority);

// ==========================================
// Consultation Management
// ==========================================
router.get('/consultations', getAdminConsultations);
router.get('/consultations/:id', getAdminConsultationById);
router.put('/consultations/:id/status', updateConsultationStatus);

// ==========================================
// Availability Calendar
// ==========================================
router.get('/availability', getAvailabilitySettings);
router.put('/availability/:id', updateAvailabilitySlot);

// ==========================================
// Formula Recording
// ==========================================
router.post('/formulas', recordFormula);
router.get('/formulas', getFormulas);

// ==========================================
// Customer Database
// ==========================================
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);

// ==========================================
// Analytics
// ==========================================
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/sales', getSalesAnalytics);

// ==========================================
// Export Functionality
// ==========================================
router.get('/export/orders', exportOrders);
router.get('/export/customers', exportCustomers);

export default router;
