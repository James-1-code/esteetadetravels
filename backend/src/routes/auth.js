const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();
const { query, pool } = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { registerValidator, loginValidator } = require('../middleware/validator');
const { sendEmail } = require('../services/email');

// Generate unique referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EST-AGT-${code}`;
};

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// @route   POST /api/auth/forgot-password
// @desc    Request password reset - send OTP to email
// @access  Public
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    console.log('📧 Forgot password request received');
    const { email } = req.body;
    console.log('📧 Email:', email);

    if (!email) {
      throw new AppError('Email address is required', 400);
    }

    // Check if user exists
    console.log('🔍 Looking for user in database...');
    const userResult = await query(
      'SELECT id, first_name, email FROM users WHERE email = $1',
      [email]
    );
    console.log('🔍 User found:', userResult.rows.length);

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent.',
      });
    }

    const user = userResult.rows[0];
    console.log('👤 User:', user.first_name, user.email);

    // Generate OTP
    const otp = generateOTP();
    console.log('🔢 Generated OTP:', otp);
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in database
    console.log('💾 Storing OTP in database...');
    await query(
      `UPDATE users SET 
        reset_otp = $1, 
        reset_otp_expiry = $2, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [otp, otpExpiry, user.id]
    );
    console.log('💾 OTP stored successfully');

    // Send email with OTP
    let emailSent = false;
    try {
      console.log('📤 Attempting to send email...');
      console.log('📤 SMTP config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        hasPass: !!process.env.SMTP_PASS
      });
      
      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - Esteetade Travels',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a9396, #005f73); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Esteetade Travels</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p style="color: #666; line-height: 1.6;">Hello ${user.first_name},</p>
              <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Use the following OTP to reset your password:</p>
              <div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #0a9396; letter-spacing: 8px;">${otp}</span>
              </div>
              <p style="color: #666; line-height: 1.6;">This OTP will expire in 15 minutes.</p>
              <p style="color: #999; font-size: 12px; line-height: 1.6;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div style="background: #333; padding: 15px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Esteetade Travels. All rights reserved.</p>
            </div>
          </div>
        `,
      });
      console.log('📤 Email result:', emailResult);
      emailSent = emailResult.success;
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      emailSent = false;
    }

    // Return different message based on email status
    if (emailSent) {
      res.json({
        success: true,
        message: 'OTP sent to your email!',
      });
    } else {
      // Email failed but OTP was stored - for development, return the OTP
      // In production, you would want this hidden
      res.json({
        success: true,
        message: 'OTP generated. Email service unavailable. Use OTP: ' + otp,
        devMode: true, // Indicates this is a development response
      });
    }
  })
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    // Find user with valid OTP
    const userResult = await query(
      `SELECT id, first_name, reset_otp, reset_otp_expiry 
       FROM users 
       WHERE email = $1 AND reset_otp = $2`,
      [email, otp]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Invalid OTP', 400);
    }

    const user = userResult.rows[0];

    // Check if OTP is expired
    if (new Date() > new Date(user.reset_otp_expiry)) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Generate a temporary token for password reset
    const tempToken = generateToken({ id: user.id, purpose: 'password-reset' });

    // Clear the OTP after verification
    await query(
      `UPDATE users SET reset_otp = NULL, reset_otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        token: tempToken,
      },
    });
  })
);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token from OTP verification
// @access  Public
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      throw new AppError('Password and confirm password are required', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Invalid or missing token', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    if (decoded.purpose !== 'password-reset') {
      throw new AppError('Invalid token purpose', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [hashedPassword, decoded.id]
    );

    // Send confirmation email
    const userResult = await query(
      'SELECT email, first_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Changed Successfully - Esteetade Travels',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0a9396, #005f73); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Esteetade Travels</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">Password Changed</h2>
                <p style="color: #666; line-height: 1.6;">Hello ${user.first_name},</p>
                <p style="color: #666; line-height: 1.6;">Your password has been changed successfully.</p>
                <p style="color: #999; font-size: 12px; line-height: 1.6;">If you did not make this change, please contact our support team immediately.</p>
              </div>
              <div style="background: #333; padding: 15px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Esteetade Travels. All rights reserved.</p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  })
);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  registerValidator,
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role, phone, referralCode } = req.body;
    
    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new AppError('Email address is already registered', 409);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Handle referral code for clients
    let referredBy = null;
    if (role === 'client' && referralCode) {
      // Make referral code case-insensitive by normalizing to uppercase
      const normalizedReferralCode = referralCode.toUpperCase().trim();
      
      const agentResult = await query(
        'SELECT id FROM users WHERE UPPER(referral_code) = $1 AND role = $2 AND admin_approved = true',
        [normalizedReferralCode, 'agent']
      );
      
      if (agentResult.rows.length === 0) {
        throw new AppError('Invalid referral code. Please check and try again.', 400);
      }
      
      referredBy = agentResult.rows[0].id;
    }
    
    // Generate referral code for agents
    const newReferralCode = role === 'agent' ? generateReferralCode() : null;
    
    // Create user
    const result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role, phone, referral_code, referred_by, email_verified, admin_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, first_name, last_name, role, referral_code, email_verified, admin_approved`,
      [
        email,
        hashedPassword,
        firstName,
        lastName,
        role,
        phone || null,
        newReferralCode,
        referredBy,
        true, // Auto-verify for now
        role === 'client' // Auto-approve clients, agents need admin approval
      ]
    );
    
    const user = result.rows[0];
    const token = generateToken(user);
    
    // Create welcome notification
    await query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [user.id, 'Welcome to Esteetade!', 'Thank you for joining Esteetade Travels. Start your journey today!', 'success']
    );
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          referralCode: user.referral_code,
        },
        token,
      },
    });
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  loginValidator,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Find user
    const result = await query(
      'SELECT id, email, password, first_name, last_name, role, referral_code, email_verified, admin_approved FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }
    
    const user = result.rows[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Check if email is verified
    if (!user.email_verified) {
      throw new AppError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');
    }
    
    // Check if agent is approved
    if (user.role === 'agent' && !user.admin_approved) {
      throw new AppError('Your agent account is pending admin approval', 403, 'AGENT_PENDING');
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          referralCode: user.referral_code,
        },
        token,
      },
    });
  })
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
const result = await query(
      'SELECT id, email, first_name, last_name, phone, role, referral_code, COALESCE(avatar_url, \'\') as avatar_url, address, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        referralCode: user.referral_code,
        avatarUrl: user.avatar_url,
        address: user.address,
        bio: user.bio,
        createdAt: user.created_at,
      },
    });
  })
);

// @route   PUT /api/auth/me
// @desc    Update current user
// @access  Private
router.put(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, address, bio, avatar } = req.body;
    
const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           bio = COALESCE($5, bio),
           avatar_url = COALESCE($6, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, email, first_name, last_name, phone, role, referral_code, COALESCE(avatar_url, \'\') as avatar_url, address, bio`,
      [firstName, lastName, phone, address, bio, avatar, req.user.id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        referralCode: user.referral_code,
        avatar: user.avatar_url,
        avatarUrl: user.avatar_url,
        address: user.address,
        bio: user.bio,
      },
    });
  })
);

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

module.exports = router;
