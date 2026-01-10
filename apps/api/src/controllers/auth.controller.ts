import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { AuthResponse, LoginRequest, SignupRequest } from '@misarh/shared';

/**
 * @route   POST /auth/signup
 * @desc    Register a new customer
 * @access  Public
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const { email, password, name, phone }: SignupRequest = req.body;

    // Check if customer already exists
    const existingCustomer = await query(
      'SELECT id FROM customers WHERE email = $1',
      [email]
    );

    if (existingCustomer.rowCount && existingCustomer.rowCount > 0) {
      res.status(409).json({
        success: false,
        error: { message: 'Email already registered', code: 'EMAIL_EXISTS' },
      });
      return;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert customer
    const result = await query(
      `INSERT INTO customers (email, password_hash, name, phone, is_admin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, phone, is_admin, created_at, updated_at`,
      [email, password_hash, name, phone || null, false]
    );

    const customer = result.rows[0];

    // Generate JWT token
    const token = generateToken(customer);

    const response: AuthResponse = {
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        is_admin: customer.is_admin,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      },
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create account' },
    });
  }
};

/**
 * @route   POST /auth/login
 * @desc    Authenticate customer and return token
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const { email, password }: LoginRequest = req.body;

    // Find customer
    const result = await query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const customer = result.rows[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, customer.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(customer);

    const response: AuthResponse = {
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        is_admin: customer.is_admin,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      },
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to login' },
    });
  }
};

/**
 * @route   GET /auth/me
 * @desc    Get current customer info
 * @access  Private
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const result = await query(
      'SELECT id, email, name, phone, is_admin, created_at, updated_at FROM customers WHERE id = $1',
      [req.user!.id]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Customer not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get customer info' },
    });
  }
};

// Validation rules
export const signupValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').optional().isMobilePhone('any'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];
