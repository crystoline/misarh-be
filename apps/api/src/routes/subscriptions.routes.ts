import { Router } from 'express';
import {
    createSubscription,
    getSubscriptions,
    updateSubscription,
    createSubscriptionValidation,
} from '../controllers/subscriptions.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /subscriptions
 * @desc    Create a new subscription
 * @access  Private
 */
router.post('/', createSubscriptionValidation, createSubscription);

/**
 * @route   GET /subscriptions
 * @desc    Get customer subscriptions
 * @access  Private
 */
router.get('/', getSubscriptions);

/**
 * @route   PUT /subscriptions/:id
 * @desc    Update (cancel/pause) subscription
 * @access  Private
 */
router.put('/:id', updateSubscription);

export default router;
