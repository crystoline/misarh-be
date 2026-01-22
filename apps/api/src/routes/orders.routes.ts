import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrderTracking,
  reorder,
  createOrderValidation,
} from '../controllers/orders.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @route   POST /orders
 * @desc    Create new order
 * @access  Private
 */
router.post('/', createOrderValidation, createOrder);

/**
 * @route   GET /orders
 * @desc    Get customer's orders
 * @access  Private
 */
router.get('/', getOrders);

/**
 * @route   GET /orders/:id
 * @desc    Get order details
 * @access  Private
 */
router.get('/:id', getOrderById);

/**
 * @route   GET /orders/:id/tracking
 * @desc    Get order tracking info
 * @access  Private
 */
router.get('/:id/tracking', getOrderTracking);

/**
 * @route   POST /orders/:id/reorder
 * @desc    Reorder existing order
 * @access  Private
 */
router.post('/:id/reorder', reorder);

export default router;
