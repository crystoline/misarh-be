import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import {
    OrderStatus,
    UpdateOrderStatusRequest,
} from '@misarh/shared';

/**
 * @route   GET /admin/orders
 * @desc    Get all orders with filtering and pagination
 * @access  Private (Admin)
 */
export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let queryText = 'SELECT o.*, c.name as customer_name, c.email as customer_email FROM orders o JOIN customers c ON o.customer_id = c.id';
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (status) {
            queryText += ` WHERE o.status = $${paramIndex++}`;
            queryParams.push(status);
        }

        queryText += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) FROM orders';
        const countParams: any[] = [];
        if (status) {
            countQuery += ' WHERE status = $1';
            countParams.push(status);
        }
        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.status(200).json({
            success: true,
            data: {
                orders: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            },
        });
    } catch (error) {
        console.error('Get admin orders error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch orders' },
        });
    }
};

/**
 * @route   PUT /admin/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, tracking_number, notes }: UpdateOrderStatusRequest = req.body;

        if (!Object.values(OrderStatus).includes(status)) {
            res.status(400).json({ success: false, error: { message: 'Invalid status' } });
            return;
        }

        const updates = ['status = $1', 'updated_at = NOW()'];
        const values: any[] = [status];
        let paramIndex = 2;

        if (tracking_number) {
            updates.push(`tracking_number = $${paramIndex++}`);
            values.push(tracking_number);
        }

        if (notes) {
            updates.push(`notes = $${paramIndex++}`);
            values.push(notes);
        }

        values.push(id); // ID as last parameter

        const result = await query(
            `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: { message: 'Order not found' } });
            return;
        }

        // Send email notification logic here based on status change
        // ...

        res.status(200).json({
            success: true,
            data: result.rows[0],
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update order status' },
        });
    }
};

/**
 * @route   GET /admin/orders/stats
 * @desc    Get order statistics
 * @access  Private (Admin)
 */
export const getOrderStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(total) as revenue
            FROM orders
            GROUP BY status
        `);

        // Also get total revenue
        const totalRevenueResult = await query('SELECT SUM(total) as total_revenue FROM orders WHERE payment_status = $1', ['successful']); // Assuming paid orders

        res.status(200).json({
            success: true,
            data: {
                by_status: result.rows,
                total_revenue: totalRevenueResult.rows[0].total_revenue || 0
            },
        });

    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch order stats' },
        });
    }
};
