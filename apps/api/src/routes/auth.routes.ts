import { Router } from 'express';
import {
  signup,
  login,
  getMe,
  signupValidation,
  loginValidation,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /auth/signup
 * @desc    Register new customer
 * @access  Public
 */
router.post('/signup', signupValidation, signup);

/**
 * @route   POST /auth/login
 * @desc    Login customer
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   GET /auth/me
 * @desc    Get current customer
 * @access  Private
 */
router.get('/me', authenticate, getMe);

export default router;
