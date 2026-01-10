import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';

/**
 * @route   POST /newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
export const subscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid email address' },
      });
      return;
    }

    const { email } = req.body;

    // Check if already subscribed
    const existingSubscriber = await query(
      'SELECT id FROM newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existingSubscriber.rows.length > 0) {
      res.status(200).json({
        success: true,
        message: 'You are already subscribed to our newsletter',
      });
      return;
    }

    // Add new subscriber
    await query(
      'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES ($1, NOW())',
      [email]
    );

    // TODO: Send welcome email via SendGrid
    // await sendEmail({
    //   to: email,
    //   subject: 'Welcome to MISARH',
    //   template: 'newsletter_welcome',
    //   data: { email }
    // });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to our newsletter!',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to subscribe. Please try again.' },
    });
  }
};

/**
 * @route   POST /contact
 * @desc    Submit contact form
 * @access  Public
 */
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: 'Please fill in all required fields' },
      });
      return;
    }

    const { name, email, subject, message } = req.body;

    // Save to database
    await query(
      'INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [name, email, subject, message]
    );

    // TODO: Send notification email to admin
    // await sendEmail({
    //   to: process.env.ADMIN_EMAIL,
    //   subject: `Contact Form: ${subject}`,
    //   template: 'contact_notification',
    //   data: { name, email, subject, message }
    // });

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send message. Please try again.' },
    });
  }
};

// Validation rules
export const subscribeValidation = [
  body('email').isEmail().withMessage('Valid email required'),
];

export const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('subject').trim().notEmpty().withMessage('Subject required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
];
