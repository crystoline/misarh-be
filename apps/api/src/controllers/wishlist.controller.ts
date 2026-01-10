import { Request, Response } from 'express';
import { query } from '../config/database';


/**
 * @route   GET /wishlist
 * @desc    Get customer's wishlist
 * @access  Private
 */
export const getWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const result = await query(
      `SELECT p.*, w.created_at as added_at
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.customer_id = $1
       ORDER BY w.created_at DESC`,
      [req.user!.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch wishlist' },
    });
  }
};

/**
 * @route   POST /wishlist/:productId
 * @desc    Add product to wishlist
 * @access  Private
 */
export const addToWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { productId } = req.params;

    // Check if product exists
    const productResult = await query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [productId]
    );

    if (!productResult.rowCount || productResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      });
      return;
    }

    // Check if already in wishlist
    const existing = await query(
      'SELECT id FROM wishlists WHERE customer_id = $1 AND product_id = $2',
      [req.user!.id, productId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      res.status(409).json({
        success: false,
        error: { message: 'Product already in wishlist' },
      });
      return;
    }

    // Add to wishlist
    await query(
      'INSERT INTO wishlists (customer_id, product_id) VALUES ($1, $2)',
      [req.user!.id, productId]
    );

    res.status(201).json({
      success: true,
      data: { message: 'Product added to wishlist' },
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add to wishlist' },
    });
  }
};

/**
 * @route   DELETE /wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
export const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { productId } = req.params;

    const result = await query(
      'DELETE FROM wishlists WHERE customer_id = $1 AND product_id = $2',
      [req.user!.id, productId]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Product not in wishlist' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: 'Product removed from wishlist' },
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove from wishlist' },
    });
  }
};
