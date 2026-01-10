import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  addToCartValidation,
} from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * @route   GET /cart
 * @desc    Get customer's cart
 * @access  Private
 */
router.get('/', getCart);

/**
 * @route   POST /cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/', addToCartValidation, addToCart);

/**
 * @route   PUT /cart/:id
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/:id', updateCartItem);

/**
 * @route   DELETE /cart/:id
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:id', removeFromCart);

/**
 * @route   DELETE /cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', clearCart);

export default router;
