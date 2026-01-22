import { Request, Response } from 'express';
import { query } from '../config/database';

/**
 * @route   GET /admin/customers
 * @desc    Get all customers with filtering
 * @access  Private (Admin)
 */
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let queryText = `
            SELECT id, email, name, phone, is_admin, created_at, updated_at
            FROM customers
            WHERE 1=1
        `;
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (search) {
            queryText += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM customers WHERE 1=1';
        const countParams: any[] = [];
        if (search) {
            countQuery += ' AND (name ILIKE $1 OR email ILIKE $1)';
            countParams.push(`%${search}%`);
        }

        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.status(200).json({
            success: true,
            data: {
                customers: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            },
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch customers' },
        });
    }
};

/**
 * @route   GET /admin/customers/:id
 * @desc    Get customer details with order history
 * @access  Private (Admin)
 */
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Get customer info
        const customerResult = await query(
            'SELECT id, email, name, phone, is_admin, created_at, updated_at FROM customers WHERE id = $1',
            [id]
        );

        if (!customerResult.rowCount || customerResult.rowCount === 0) {
            res.status(404).json({
                success: false,
                error: { message: 'Customer not found' },
            });
            return;
        }

        // Get order count and total spent
        const ordersResult = await query(
            `SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(total), 0) as total_spent
             FROM orders 
             WHERE customer_id = $1 AND payment_status = 'successful'`,
            [id]
        );

        // Get recent orders
        const recentOrders = await query(
            'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5',
            [id]
        );

        // Get consultations
        const consultations = await query(
            'SELECT * FROM consultations WHERE customer_id = $1 ORDER BY date DESC LIMIT 5',
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                customer: customerResult.rows[0],
                stats: ordersResult.rows[0],
                recent_orders: recentOrders.rows,
                consultations: consultations.rows
            },
        });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch customer' },
        });
    }
};

/**
 * @route   GET /admin/analytics/overview
 * @desc    Get analytics overview
 * @access  Private (Admin)
 */
export const getAnalyticsOverview = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Total revenue
        const revenueResult = await query(
            `SELECT COALESCE(SUM(total), 0) as total_revenue 
             FROM orders 
             WHERE payment_status = 'successful'`
        );

        // Total orders
        const ordersResult = await query('SELECT COUNT(*) as total_orders FROM orders');

        // Total consultations
        const consultationsResult = await query('SELECT COUNT(*) as total_consultations FROM consultations');

        // Total customers
        const customersResult = await query('SELECT COUNT(*) as total_customers FROM customers WHERE is_admin = false');

        // Revenue by month (last 12 months)
        const revenueByMonth = await query(`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE payment_status = 'successful'
                AND created_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month DESC
        `);

        // Top products
        const topProducts = await query(`
            SELECT 
                p.id, p.name, p.slug, p.base_price,
                COUNT(oi.id) as sales_count,
                SUM(oi.total_price) as total_revenue
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.payment_status = 'successful'
            GROUP BY p.id, p.name, p.slug, p.base_price
            ORDER BY sales_count DESC
            LIMIT 10
        `);

        // Consultation trends (last 30 days)
        const consultationTrends = await query(`
            SELECT 
                DATE(date) as date,
                COUNT(*) as count
            FROM consultations
            WHERE date >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(date)
            ORDER BY date DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
                total_orders: parseInt(ordersResult.rows[0].total_orders),
                total_consultations: parseInt(consultationsResult.rows[0].total_consultations),
                total_customers: parseInt(customersResult.rows[0].total_customers),
                revenue_by_month: revenueByMonth.rows,
                top_products: topProducts.rows,
                consultation_trends: consultationTrends.rows
            },
        });
    } catch (error) {
        console.error('Get analytics overview error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch analytics' },
        });
    }
};

/**
 * @route   GET /admin/analytics/sales
 * @desc    Get sales analytics
 * @access  Private (Admin)
 */
export const getSalesAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { period = '30days' } = req.query;

        let interval = '30 days';
        if (period === '7days') interval = '7 days';
        if (period === '90days') interval = '90 days';
        if (period === '1year') interval = '1 year';

        // Sales by day
        const salesByDay = await query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE payment_status = 'successful'
                AND created_at >= NOW() - INTERVAL '${interval}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        // Sales by status
        const salesByStatus = await query(`
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '${interval}'
            GROUP BY status
        `);

        // Sales by product family
        const salesByFamily = await query(`
            SELECT 
                p.family,
                COUNT(oi.id) as sales_count,
                COALESCE(SUM(oi.total_price), 0) as revenue
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.payment_status = 'successful'
                AND o.created_at >= NOW() - INTERVAL '${interval}'
            GROUP BY p.family
            ORDER BY revenue DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                period,
                sales_by_day: salesByDay.rows,
                sales_by_status: salesByStatus.rows,
                sales_by_family: salesByFamily.rows
            },
        });
    } catch (error) {
        console.error('Get sales analytics error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch sales analytics' },
        });
    }
};

/**
 * @route   GET /admin/export/orders
 * @desc    Export orders as CSV
 * @access  Private (Admin)
 */
export const exportOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, date_from, date_to } = req.query;

        let queryText = `
            SELECT 
                o.order_number,
                o.created_at,
                c.name as customer_name,
                c.email as customer_email,
                o.subtotal,
                o.discount,
                o.total,
                o.status,
                o.payment_status,
                o.tracking_number
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE 1=1
        `;
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (status) {
            queryText += ` AND o.status = $${paramIndex++}`;
            queryParams.push(status);
        }
        if (date_from) {
            queryText += ` AND o.created_at >= $${paramIndex++}`;
            queryParams.push(date_from);
        }
        if (date_to) {
            queryText += ` AND o.created_at <= $${paramIndex++}`;
            queryParams.push(date_to);
        }

        queryText += ' ORDER BY o.created_at DESC';

        const result = await query(queryText, queryParams);

        // Convert to CSV
        const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Subtotal', 'Discount', 'Total', 'Status', 'Payment Status', 'Tracking Number'];
        const csvRows = [headers.join(',')];

        result.rows.forEach((row: any) => {
            const values = [
                row.order_number,
                new Date(row.created_at).toISOString(),
                `"${row.customer_name || ''}"`,
                row.customer_email,
                row.subtotal,
                row.discount,
                row.total,
                row.status,
                row.payment_status,
                row.tracking_number || ''
            ];
            csvRows.push(values.join(','));
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        console.error('Export orders error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to export orders' },
        });
    }
};

/**
 * @route   GET /admin/export/customers
 * @desc    Export customers as CSV
 * @access  Private (Admin)
 */
export const exportCustomers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(`
            SELECT 
                c.email,
                c.name,
                c.phone,
                c.created_at,
                COUNT(DISTINCT o.id) as order_count,
                COALESCE(SUM(o.total), 0) as total_spent
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id AND o.payment_status = 'successful'
            WHERE c.is_admin = false
            GROUP BY c.id, c.email, c.name, c.phone, c.created_at
            ORDER BY c.created_at DESC
        `);

        // Convert to CSV
        const headers = ['Email', 'Name', 'Phone', 'Joined Date', 'Order Count', 'Total Spent'];
        const csvRows = [headers.join(',')];

        result.rows.forEach((row: any) => {
            const values = [
                row.email,
                `"${row.name || ''}"`,
                row.phone || '',
                new Date(row.created_at).toISOString(),
                row.order_count,
                row.total_spent
            ];
            csvRows.push(values.join(','));
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=customers-${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        console.error('Export customers error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to export customers' },
        });
    }
};
