import { Request, Response } from 'express';
import { query } from '../config/database';

/**
 * @route   GET /admin/consultations
 * @desc    Get all consultations with filtering
 * @access  Private (Admin)
 */
export const getAdminConsultations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, page = 1, limit = 10, date_from, date_to } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let queryText = `
            SELECT c.*, cu.name as customer_name, cu.email as customer_email 
            FROM consultations c 
            JOIN customers cu ON c.customer_id = cu.id
            WHERE 1=1
        `;
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (status) {
            queryText += ` AND c.status = $${paramIndex++}`;
            queryParams.push(status);
        }

        if (date_from) {
            queryText += ` AND c.date >= $${paramIndex++}`;
            queryParams.push(date_from);
        }

        if (date_to) {
            queryText += ` AND c.date <= $${paramIndex++}`;
            queryParams.push(date_to);
        }

        queryText += ` ORDER BY c.date DESC, c.time_slot DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM consultations WHERE 1=1';
        const countParams: any[] = [];
        let countIndex = 1;

        if (status) {
            countQuery += ` AND status = $${countIndex++}`;
            countParams.push(status);
        }
        if (date_from) {
            countQuery += ` AND date >= $${countIndex++}`;
            countParams.push(date_from);
        }
        if (date_to) {
            countQuery += ` AND date <= $${countIndex++}`;
            countParams.push(date_to);
        }

        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.status(200).json({
            success: true,
            data: {
                consultations: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            },
        });
    } catch (error) {
        console.error('Get admin consultations error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch consultations' },
        });
    }
};

/**
 * @route   PUT /admin/consultations/:id/status
 * @desc    Update consultation status
 * @access  Private (Admin)
 */
export const updateConsultationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['booked', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ success: false, error: { message: 'Invalid status' } });
            return;
        }

        const updates = ['status = $1', 'updated_at = NOW()'];
        const values: any[] = [status];
        let paramIndex = 2;

        if (notes) {
            updates.push(`notes = $${paramIndex++}`);
            values.push(notes);
        }

        values.push(id);

        const result = await query(
            `UPDATE consultations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: { message: 'Consultation not found' } });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update consultation status error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update consultation status' },
        });
    }
};

/**
 * @route   GET /admin/consultations/:id
 * @desc    Get consultation details
 * @access  Private (Admin)
 */
export const getAdminConsultationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT c.*, cu.name as customer_name, cu.email as customer_email, cu.phone as customer_phone
             FROM consultations c 
             JOIN customers cu ON c.customer_id = cu.id
             WHERE c.id = $1`,
            [id]
        );

        if (!result.rowCount || result.rowCount === 0) {
            res.status(404).json({
                success: false,
                error: { message: 'Consultation not found' },
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Get consultation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch consultation' },
        });
    }
};

/**
 * @route   GET /admin/availability
 * @desc    Get availability calendar settings
 * @access  Private (Admin)
 */
export const getAvailabilitySettings = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            'SELECT * FROM availability_slots ORDER BY day_of_week, time_slot'
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get availability settings error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch availability settings' },
        });
    }
};

/**
 * @route   PUT /admin/availability/:id
 * @desc    Update availability slot
 * @access  Private (Admin)
 */
export const updateAvailabilitySlot = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { is_available } = req.body;

        if (typeof is_available !== 'boolean') {
            res.status(400).json({ success: false, error: { message: 'is_available must be a boolean' } });
            return;
        }

        const result = await query(
            'UPDATE availability_slots SET is_available = $1 WHERE id = $2 RETURNING *',
            [is_available, id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: { message: 'Availability slot not found' } });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update availability slot error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update availability slot' },
        });
    }
};

/**
 * @route   POST /admin/formulas
 * @desc    Record custom formula for a consultation
 * @access  Private (Admin)
 */
export const recordFormula = async (req: Request, res: Response): Promise<void> => {
    try {
        const { consultation_id, customer_id, fragrance_name, bottle_number, ingredients, mixing_notes, images } = req.body;

        if (!consultation_id || !customer_id || !fragrance_name || !ingredients) {
            res.status(400).json({
                success: false,
                error: { message: 'consultation_id, customer_id, fragrance_name, and ingredients are required' }
            });
            return;
        }

        const result = await query(
            `INSERT INTO custom_formulas (
                consultation_id, customer_id, fragrance_name, bottle_number,
                ingredients, mixing_notes, images
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                consultation_id,
                customer_id,
                fragrance_name,
                bottle_number || null,
                JSON.stringify(ingredients),
                mixing_notes || null,
                JSON.stringify(images || [])
            ]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Record formula error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to record formula' },
        });
    }
};

/**
 * @route   GET /admin/formulas
 * @desc    Get all custom formulas
 * @access  Private (Admin)
 */
export const getFormulas = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customer_id, page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let queryText = `
            SELECT f.*, cu.name as customer_name, cu.email as customer_email,
                   c.consultation_number
            FROM custom_formulas f
            JOIN customers cu ON f.customer_id = cu.id
            LEFT JOIN consultations c ON f.consultation_id = c.id
            WHERE 1=1
        `;
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (customer_id) {
            queryText += ` AND f.customer_id = $${paramIndex++}`;
            queryParams.push(customer_id);
        }

        queryText += ` ORDER BY f.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM custom_formulas WHERE 1=1';
        const countParams: any[] = [];
        if (customer_id) {
            countQuery += ' AND customer_id = $1';
            countParams.push(customer_id);
        }

        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.status(200).json({
            success: true,
            data: {
                formulas: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            },
        });
    } catch (error) {
        console.error('Get formulas error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch formulas' },
        });
    }
};
