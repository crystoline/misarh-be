import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

/**
 * @route   GET /wishlist
 * @desc    Get customer's wishlist
 * @access  Private
 */
router.get('/', getWishlist);

/**
 * @route   POST /wishlist/:productId
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post('/:productId', addToWishlist);

/**
 * @route   DELETE /wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete('/:productId', removeFromWishlist);

export default router;
