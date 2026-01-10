import { Router } from 'express';
import {
  getAvailability,
  analyzeScent,
  createBooking,
  createPendingBooking,
  confirmConsultationBooking,
  bookConsultation,
  getConsultations,
  getConsultationById,
  bookConsultationValidation,
} from '../controllers/consultations.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /consultations/availability
 * @desc    Get available consultation slots
 * @access  Public
 */
router.get('/availability', getAvailability);

/**
 * @route   POST /consultations/analyze
 * @desc    Analyze scent preferences with AI
 * @access  Public
 */
router.post('/analyze', analyzeScent);

/**
 * @route   POST /consultations/pending
 * @desc    Create pending consultation booking (before payment)
 * @access  Private
 */
router.post('/pending', authenticate, createPendingBooking);

/**
 * @route   PUT /consultations/:id/confirm
 * @desc    Confirm consultation booking after payment
 * @access  Private
 */
router.put('/:id/confirm', authenticate, confirmConsultationBooking);

/**
 * @route   POST /consultations/book
 * @desc    Create consultation booking
 * @access  Private
 */
router.post('/book', authenticate, createBooking);

/**
 * @route   POST /consultations
 * @desc    Book consultation
 * @access  Private
 */
router.post('/', authenticate, bookConsultationValidation, bookConsultation);

/**
 * @route   GET /consultations
 * @desc    Get customer's consultations
 * @access  Private
 */
router.get('/', authenticate, getConsultations);

/**
 * @route   GET /consultations/:id
 * @desc    Get consultation details
 * @access  Private
 */
router.get('/:id', authenticate, getConsultationById);

export default router;
