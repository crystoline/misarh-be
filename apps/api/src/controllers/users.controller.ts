import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/auth';

/**
 * @route   PUT /users/profile
 * @desc    Update current user profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
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

    const { name, phone } = req.body;
    
    // Build update query dynamically
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
        fields.push(`name = $${paramIndex++}`);
        values.push(name);
    }
    if (phone) {
        fields.push(`phone = $${paramIndex++}`);
        values.push(phone);
    }

    if (fields.length === 0) {
       res.status(400).json({ success: false, error: { message: 'No fields to update' } });
       return;
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.user.id); // Add ID for WHERE clause

    const queryString = `
        UPDATE customers 
        SET ${fields.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, email, name, phone, is_admin, created_at, updated_at
    `;

    const result = await query(queryString, values);

    if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: { message: 'User not found' } });
        return;
    }

    res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update profile' },
    });
  }
};

/**
 * @route   PUT /users/password
 * @desc    Change current user password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
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

        const { currentPassword, newPassword } = req.body;

        // Get current password hash
        const userResult = await query('SELECT password_hash FROM customers WHERE id = $1', [req.user.id]);
        
        if (userResult.rowCount === 0) {
             res.status(404).json({ success: false, error: { message: 'User not found' } });
             return;
        }

        const user = userResult.rows[0];
        const isMatch = await comparePassword(currentPassword, user.password_hash);

        if (!isMatch) {
            res.status(400).json({ success: false, error: { message: 'Incorrect current password' } });
            return;
        }

        const newHash = await hashPassword(newPassword);

        await query('UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Failed to change password' },
        });
    }
};

export const updateProfileValidation = [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
];

export const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];
