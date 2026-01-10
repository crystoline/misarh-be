import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/database';
import {
  Order,
  CreateOrderRequest,
  OrderResponse,
  OrderStatus,
  PaymentStatus,
} from '@misarh/shared';

/**
 * Generate unique order number
 */
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * @route   POST /orders
 * @desc    Create new order from cart
 * @access  Private
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
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

    const { items, shipping_address, payment_method, promo_code }: CreateOrderRequest = req.body;

    // Use transaction to ensure data consistency
    const result = await transaction(async (client) => {
      // Calculate totals
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of items) {
        const productResult = await client.query(
          'SELECT id, name, base_price, stock_level FROM products WHERE id = $1',
          [item.product_id]
        );

        if (productResult.rowCount === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const product = productResult.rows[0];
        const itemTotal = product.base_price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          size: item.size,
          unit_price: product.base_price,
          total_price: itemTotal,
        });
      }

      // Apply promo code if provided
      let discount = 0;
      if (promo_code) {
        const promoResult = await client.query(
          `SELECT * FROM promo_codes 
           WHERE code = $1 AND is_active = true 
           AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
          [promo_code]
        );

        if (promoResult.rowCount && promoResult.rowCount > 0) {
          const promo = promoResult.rows[0];
          if (promo.discount_type === 'percentage') {
            discount = (subtotal * promo.discount_value) / 100;
          } else {
            discount = promo.discount_value;
          }
        }
      }

      const total = subtotal - discount;
      const orderNumber = generateOrderNumber();

      // Create order
      const orderResult = await client.query<Order>(
        `INSERT INTO orders (
          order_number, customer_id, subtotal, discount, total, 
          status, payment_method, payment_status, shipping_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          orderNumber,
          req.user!.id,
          subtotal,
          discount,
          total,
          OrderStatus.PENDING,
          payment_method,
          PaymentStatus.PENDING,
          JSON.stringify(shipping_address),
        ]
      );

      const order = orderResult.rows[0];

      // Create order items
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, quantity, size, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order.id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.size,
            item.unit_price,
            item.total_price,
          ]
        );
      }

      // Clear cart
      await client.query('DELETE FROM carts WHERE customer_id = $1', [req.user!.id]);

      return { order, items: orderItems };
    });

    const response: OrderResponse = {
      order: result.order,
      items: result.items,
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create order' },
    });
  }
};

/**
 * @route   GET /orders
 * @desc    Get customer's orders
 * @access  Private
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const result = await query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch orders' },
    });
  }
};

/**
 * @route   GET /orders/:id
 * @desc    Get single order with items
 * @access  Private
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { id } = req.params;

    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
      [id, req.user!.id]
    );

    if (!orderResult.rowCount || orderResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
      return;
    }

    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );

    const response: OrderResponse = {
      order: orderResult.rows[0],
      items: itemsResult.rows,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch order' },
    });
  }
};

// Validation rules
export const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.product_id').isUUID().withMessage('Valid product ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
  body('shipping_address.full_name').notEmpty().withMessage('Full name required'),
  body('shipping_address.address_line1').notEmpty().withMessage('Address required'),
  body('shipping_address.city').notEmpty().withMessage('City required'),
  body('shipping_address.state').notEmpty().withMessage('State required'),
  body('shipping_address.country').notEmpty().withMessage('Country required'),
  body('payment_method').notEmpty().withMessage('Payment method required'),
];
