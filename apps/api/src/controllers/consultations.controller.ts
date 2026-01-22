import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/database';
import { analyzeScentProfile } from '../services/ai.service';
import { createPaymentLink } from '../services/paystack.service';
import {
  Consultation,
  BookConsultationRequest,
  ConsultationStatus,
  ConsultationResponse,
} from '@misarh/shared';

/**
 * Generate unique consultation number
 */
const generateConsultationNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CONS-${timestamp}-${random}`;
};

/**
 * @route   GET /consultations/availability
 * @desc    Get available consultation slots for a month
 * @access  Public
 */
export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({
        success: false,
        error: { message: 'Month and year parameters required' },
      });
      return;
    }

    // Get all booked slots for the month
    const bookedSlots = await query(
      `SELECT date, time_slot FROM consultations 
       WHERE EXTRACT(MONTH FROM date) = $1 
       AND EXTRACT(YEAR FROM date) = $2 
       AND status != 'cancelled'`,
      [month, year]
    );

    // Define available time slots
    const timeSlots = ['10:00', '12:00', '14:00', '16:00', '18:00'];

    // Generate dates for the month
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    const dates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(date).getDay();
      
      // Skip Sundays (0) and Mondays (1)
      if (dayOfWeek === 0 || dayOfWeek === 1) {
        continue;
      }

      // Skip past dates
      if (new Date(date) < new Date()) {
        continue;
      }

      const slots = timeSlots.map(time => {
        const isBooked = bookedSlots.rows.some(
          (slot: any) => {
            const slotDate = new Date(slot.date).toISOString().split('T')[0];
            return slotDate === date && slot.time_slot === time;
          }
        );
        
        return {
          time,
          available: !isBooked
        };
      });

      dates.push({
        date,
        slots
      });
    }

    res.status(200).json({
      success: true,
      data: { dates },
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch availability' },
    });
  }
};

/**
 * @route   POST /consultations/analyze
 * @desc    Analyze scent preferences with AI
 * @access  Public
 */
export const analyzeScent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loves, avoids, emotions, lifestyle, intensity } = req.body;

    if (!loves || !emotions) {
      res.status(400).json({
        success: false,
        error: { message: 'Questionnaire data required' },
      });
      return;
    }

    // Prepare questionnaire data for AI analysis
    const questionnaireData = {
      loves_scents: loves,
      avoids_scents: avoids || '',
      desired_emotions: emotions,
      lifestyle: lifestyle || [],
      intensity: intensity || 5
    };

    const aiProfile = await analyzeScentProfile(questionnaireData);

    res.status(200).json({
      success: true,
      data: aiProfile,
    });
  } catch (error: any) {
    console.error('Analyze scent error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to analyze scent preferences' },
    });
  }
};

/**
 * @route   POST /consultations/book
 * @desc    Create consultation booking
 * @access  Private
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { date, time, questionnaire, ai_profile, payment_reference } = req.body;

    if (!date || !time || !questionnaire || !ai_profile) {
      res.status(400).json({
        success: false,
        error: { message: 'Required fields missing' },
      });
      return;
    }

    // Use transaction for booking
    const result = await transaction(async (client) => {
      // Check if slot is already booked
      const bookedCheck = await client.query(
        'SELECT id FROM booked_slots WHERE date = $1 AND time_slot = $2',
        [date, time]
      );

      if (bookedCheck.rowCount && bookedCheck.rowCount > 0) {
        throw new Error('Slot already booked');
      }

      const consultationNumber = generateConsultationNumber();

      // Create consultation
      const consultationResult = await client.query<Consultation>(
        `INSERT INTO consultations (
          consultation_number, customer_id, date, time_slot,
          questionnaire_data, ai_profile, status, booking_fee, payment_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          consultationNumber,
          req.user!.id,
          date,
          time,
          JSON.stringify(questionnaire),
          JSON.stringify(ai_profile),
          ConsultationStatus.BOOKED,
          30000, // ₦30,000 booking fee
          payment_reference || null
        ]
      );

      const consultation = consultationResult.rows[0];

      // Mark slot as booked
      await client.query(
        'INSERT INTO booked_slots (consultation_id, date, time_slot) VALUES ($1, $2, $3)',
        [consultation.id, date, time]
      );

      return { consultation, ai_profile };
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.consultation.id,
        booking_number: result.consultation.consultation_number,
        status: 'confirmed',
        email_sent: true
      },
    });
  } catch (error: any) {
    console.error('Create booking error:', error);

    if (error.message === 'Slot already booked') {
      res.status(409).json({
        success: false,
        error: { message: 'This time slot is no longer available' },
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create booking' },
      });
    }
  }
};

/**
 * @route   POST /consultations/pending
 * @desc    Create pending consultation booking (before payment)
 * @access  Private
 */
export const createPendingBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { date, time, questionnaire, ai_profile } = req.body;

    if (!date || !time || !questionnaire || !ai_profile) {
      res.status(400).json({
        success: false,
        error: { message: 'Required fields missing' },
      });
      return;
    }

    // Check if slot is still available
    const existingBooking = await query(
      `SELECT id FROM consultations 
       WHERE date = $1 AND time_slot = $2 AND status != 'cancelled'`,
      [date, time]
    );

    if (existingBooking.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: { message: 'This time slot is no longer available' },
      });
      return;
    }

    const consultationNumber = generateConsultationNumber();

    // Create pending consultation
    const result = await query(
      `INSERT INTO consultations (
        consultation_number, customer_id, date, time_slot,
        questionnaire_data, ai_profile, status, booking_fee
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, consultation_number, status`,
      [
        consultationNumber,
        req.user!.id,
        date,
        time,
        JSON.stringify(questionnaire),
        JSON.stringify(ai_profile),
        'pending', // Pending until payment
        30000
      ]
    );

    const consultation = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: consultation.id,
        booking_number: consultation.consultation_number,
        status: consultation.status
      },
    });
  } catch (error: any) {
    console.error('Create pending booking error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create pending booking' },
    });
  }
};

/**
 * @route   PUT /consultations/:id/confirm
 * @desc    Confirm consultation booking after payment
 * @access  Private
 */
export const confirmConsultationBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { id } = req.params;
    const { payment_reference } = req.body;

    if (!payment_reference) {
      res.status(400).json({
        success: false,
        error: { message: 'Payment reference required' },
      });
      return;
    }

    // Update booking to confirmed with payment reference
    const result = await query(
      `UPDATE consultations 
       SET status = 'confirmed', 
           payment_reference = $1,
           updated_at = NOW()
       WHERE id = $2 AND customer_id = $3 AND status = 'pending'
       RETURNING *`,
      [payment_reference, id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Booking not found or already confirmed' },
      });
      return;
    }

    const consultation = result.rows[0];

    // TODO: Send confirmation email here
    // await sendEmail({...});

    res.status(200).json({
      success: true,
      data: {
        id: consultation.id,
        booking_number: consultation.consultation_number,
        status: 'confirmed',
        email_sent: true
      },
    });
  } catch (error: any) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to confirm booking' },
    });
  }
};

/**
 * @route   POST /consultations
 * @desc    Book a consultation with AI profile analysis
 * @access  Private
 */
export const bookConsultation = async (req: Request, res: Response): Promise<void> => {
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

    const { questionnaire_data, date, time_slot }: BookConsultationRequest = req.body;

    // Use transaction for booking
    const result = await transaction(async (client) => {
      // Check if slot is available
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      const slotCheck = await client.query(
        `SELECT id FROM availability_slots 
         WHERE day_of_week = $1 AND time_slot = $2 AND is_available = true`,
        [dayOfWeek, time_slot]
      );

      if (slotCheck.rowCount === 0) {
        throw new Error('Slot not available');
      }

      // Check if already booked
      const bookedCheck = await client.query(
        'SELECT id FROM booked_slots WHERE date = $1 AND time_slot = $2',
        [date, time_slot]
      );

      if (bookedCheck.rowCount && bookedCheck.rowCount > 0) {
        throw new Error('Slot already booked');
      }

      // Analyze questionnaire with AI
      console.log('🤖 Analyzing scent profile with OpenAI...');
      const aiProfile = await analyzeScentProfile(questionnaire_data);

      const consultationNumber = generateConsultationNumber();

      // Create consultation
      const consultationResult = await client.query<Consultation>(
        `INSERT INTO consultations (
          consultation_number, customer_id, date, time_slot,
          questionnaire_data, ai_profile, status, booking_fee
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          consultationNumber,
          req.user!.id,
          date,
          time_slot,
          JSON.stringify(questionnaire_data),
          JSON.stringify(aiProfile),
          ConsultationStatus.BOOKED,
          30000, // ₦30,000 booking fee
        ]
      );

      const consultation = consultationResult.rows[0];

      // Mark slot as booked
      await client.query(
        'INSERT INTO booked_slots (consultation_id, date, time_slot) VALUES ($1, $2, $3)',
        [consultation.id, date, time_slot]
      );

      return { consultation, ai_profile: aiProfile };
    });

    // Initialize payment with Paystack
    let paymentData = null;
    try {
      paymentData = await createPaymentLink({
        orderId: result.consultation.consultation_number,
        customerEmail: req.user!.email,
        amount: result.consultation.booking_fee,
        type: 'consultation',
        metadata: {
          customer_id: req.user!.id,
          consultation_id: result.consultation.id,
        },
      });
    } catch (paymentError) {
      console.error('Payment initialization failed:', paymentError);
      // Continue with consultation booking even if payment fails
    }

    const response: ConsultationResponse = {
      consultation: result.consultation,
      ai_profile: result.ai_profile,
      payment_url: paymentData?.paymentUrl,
      payment_reference: paymentData?.reference,
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Book consultation error:', error);
    
    if (error.message === 'Slot not available' || error.message === 'Slot already booked') {
      res.status(409).json({
        success: false,
        error: { message: error.message },
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to book consultation' },
      });
    }
  }
};

/**
 * @route   GET /consultations
 * @desc    Get customer's consultations
 * @access  Private
 */
export const getConsultations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const result = await query(
      'SELECT * FROM consultations WHERE customer_id = $1 ORDER BY date DESC, time_slot DESC',
      [req.user!.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch consultations' },
    });
  }
};

/**
 * @route   GET /consultations/:id
 * @desc    Get consultation details
 * @access  Private
 */
export const getConsultationById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { id } = req.params;

    const result = await query(
      'SELECT * FROM consultations WHERE id = $1 AND customer_id = $2',
      [id, req.user!.id]
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

// Validation rules
export const bookConsultationValidation = [
  body('questionnaire_data.loves_scents').notEmpty().withMessage('Loved scents required'),
  body('questionnaire_data.avoids_scents').notEmpty().withMessage('Avoided scents required'),
  body('questionnaire_data.desired_emotions').notEmpty().withMessage('Desired emotions required'),
  body('questionnaire_data.lifestyle').isArray({ min: 1 }).withMessage('Lifestyle required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time_slot').matches(/^\d{2}:\d{2}:\d{2}$/).withMessage('Valid time slot required (HH:MM:SS)'),
];
