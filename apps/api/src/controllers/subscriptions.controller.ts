import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import {
    SubscriptionStatus,
    SubscriptionTier,
    CreateSubscriptionRequest,
    UpdateSubscriptionRequest,
} from '@misarh/shared';

/**
 * @route   POST /subscriptions
 * @desc    Create a new subscription
 * @access  Private
 */
export const createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: errors.array() },
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
            return;
        }

        const { tier, frequency }: CreateSubscriptionRequest = req.body;

        // Default pricing logic (should be in a service or config)
        const prices = {
            [SubscriptionTier.DISCOVERY]: 20000,
            [SubscriptionTier.PREMIUM]: 45000,
        };

        let price = prices[tier] || 20000;
        if (frequency === 'quarterly') {
            price = price * 3 * 0.9; // 10% discount for quarterly
        }

        const result = await query(
            `INSERT INTO subscriptions (
        customer_id, tier, price, status, frequency, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`,
            [req.user.id, tier, price, SubscriptionStatus.ACTIVE, frequency]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create subscription' },
        });
    }
};

/**
 * @route   GET /subscriptions
 * @desc    Get customer subscriptions
 * @access  Private
 */
export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
            return;
        }

        const result = await query(
            'SELECT * FROM subscriptions WHERE customer_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });

    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch subscriptions' },
        });
    }
};

/**
 * @route   PUT /subscriptions/:id
 * @desc    Update/Cancel subscription
 * @access  Private
 */
export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
            return;
        }

        const { id } = req.params;
        const { status }: UpdateSubscriptionRequest = req.body;

        if (!status) {
            res.status(400).json({ success: false, error: { message: 'Status is required' } });
            return;
        }

        const result = await query(
            'UPDATE subscriptions SET status = $1, updated_at = NOW(), cancelled_at = CASE WHEN $1 = $2 THEN NOW() ELSE cancelled_at END WHERE id = $3 AND customer_id = $4 RETURNING *',
            [status, SubscriptionStatus.CANCELLED, id, req.user.id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: { message: 'Subscription not found' } });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
        });

    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update subscription' },
        });
    }
};

export const createSubscriptionValidation = [
    body('tier').isIn(Object.values(SubscriptionTier)).withMessage('Invalid subscription tier'),
    body('frequency').isIn(['monthly', 'quarterly']).withMessage('Invalid frequency'),
];
