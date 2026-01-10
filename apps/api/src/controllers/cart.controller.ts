import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { AddToCartRequest, UpdateCartRequest } from '@misarh/shared';

/**
 * @route   GET /cart
 * @desc    Get customer's cart
 * @access  Private
 */
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const result = await query(
      `SELECT c.*, 
              p.id as product_id,
              p.name as product_name, 
              p.slug, 
              p.base_price, 
              p.images,
              p.stock_level
       FROM carts c
       JOIN products p ON c.product_id = p.id
       WHERE c.customer_id = $1`,
      [req.user!.id]
    );

    const items = result.rows;
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.base_price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        items,
        subtotal,
        total_items: items.length,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch cart' },
    });
  }
};

/**
 * @route   POST /cart
 * @desc    Add item to cart
 * @access  Private
 */
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: 'Validation failed' },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { product_id, quantity, size }: AddToCartRequest = req.body;

    // Check if product exists and is active
    const productResult = await query(
      'SELECT id, stock_level FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (!productResult.rowCount || productResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      });
      return;
    }

    // Check if item already exists in cart
    const existingItem = await query(
      'SELECT * FROM carts WHERE customer_id = $1 AND product_id = $2 AND size = $3',
      [req.user!.id, product_id, size || null]
    );

    if (existingItem.rowCount && existingItem.rowCount > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      await query(
        'UPDATE carts SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, existingItem.rows[0].id]
      );
    } else {
      // Insert new item
      await query(
        `INSERT INTO carts (customer_id, product_id, quantity, size)
         VALUES ($1, $2, $3, $4)`,
        [req.user!.id, product_id, quantity, size || null]
      );
    }

    // Return updated cart
    await getCart(req, res);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add item to cart' },
    });
  }
};

/**
 * @route   PUT /cart/:id
 * @desc    Update cart item quantity
 * @access  Private
 */
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { id } = req.params;
    const { quantity }: UpdateCartRequest = req.body;

    if (quantity < 1) {
      res.status(400).json({
        success: false,
        error: { message: 'Quantity must be at least 1' },
      });
      return;
    }

    const result = await query(
      'UPDATE carts SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND customer_id = $3 RETURNING *',
      [quantity, id, req.user!.id]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Cart item not found' },
      });
      return;
    }

    await getCart(req, res);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update cart item' },
    });
  }
};

/**
 * @route   DELETE /cart/:id
 * @desc    Remove item from cart
 * @access  Private
 */
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM carts WHERE id = $1 AND customer_id = $2',
      [id, req.user!.id]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Cart item not found' },
      });
      return;
    }

    await getCart(req, res);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove item from cart' },
    });
  }
};

/**
 * @route   DELETE /cart
 * @desc    Clear entire cart
 * @access  Private
 */
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    await query('DELETE FROM carts WHERE customer_id = $1', [req.user!.id]);

    res.status(200).json({
      success: true,
      data: { message: 'Cart cleared successfully' },
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to clear cart' },
    });
  }
};

// Validation rules
export const addToCartValidation = [
  body('product_id').isUUID().withMessage('Valid product ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('size').optional().isString(),
];
