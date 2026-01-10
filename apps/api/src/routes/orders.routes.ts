import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
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

export default router;
