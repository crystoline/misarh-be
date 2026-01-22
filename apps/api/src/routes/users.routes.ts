import { Router } from 'express';
import {
    updateProfile,
    changePassword,
    updateProfileValidation,
    changePasswordValidation,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   PUT /users/profile
 * @desc    Update current customer profile
 * @access  Private
 */
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

/**
 * @route   PUT /users/password
 * @desc    Change current customer password
 * @access  Private
 */
router.put('/password', authenticate, changePasswordValidation, changePassword);

export default router;
