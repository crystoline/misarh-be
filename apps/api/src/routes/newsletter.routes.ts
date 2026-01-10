import { Router } from 'express';
import {
  subscribe,
  submitContactForm,
  subscribeValidation,
  contactValidation,
} from '../controllers/newsletter.controller';

const router = Router();

/**
 * @route   POST /newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
router.post('/subscribe', subscribeValidation, subscribe);

/**
 * @route   POST /contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/', contactValidation, submitContactForm);

export default router;
