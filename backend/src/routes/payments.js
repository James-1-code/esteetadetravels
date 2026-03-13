const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const paystack = require('../services/paystack');
const { sendEmail } = require('../services/email');
const { notifyPaymentReceived, notifyUser } = require('../services/socket');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// @route   POST /api/payments/initialize
// @desc    Initialize Paystack payment
// @access  Private (all authenticated users)
router.post(
  '/initialize',
  authenticate,
  asyncHandler(async (req, res) => {
    const { invoiceId } = req.body;

    // Get invoice details
    const invoiceResult = await query(
      `SELECT i.*, COALESCE(a.type_label, 'Price Quote') as type_label, u.email, u.first_name, u.last_name
       FROM invoices i
       LEFT JOIN applications a ON i.application_id = a.id
       JOIN users u ON i.client_id = u.id
       WHERE i.id = $1 AND i.client_id = $2`,
      [invoiceId, req.user.id]
    );

    if (invoiceResult.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const invoice = invoiceResult.rows[0];

    if (invoice.status === 'paid') {
      throw new AppError('Invoice is already paid', 400);
    }

    // Initialize Paystack transaction
    const paymentReference = `PAY-${Date.now()}-${invoice.id.slice(0, 8)}`;

    const paystackResponse = await paystack.initializeTransaction({
      email: invoice.email,
      amount: invoice.amount,
      reference: paymentReference,
      callback_url: `${FRONTEND_URL}/dashboard/invoices`,
      metadata: {
        invoice_id: invoice.id,
        user_id: req.user.id,
        custom_fields: [
          {
            display_name: 'Service Type',
            variable_name: 'service_type',
            value: invoice.type_label,
          },
          {
            display_name: 'Invoice Number',
            variable_name: 'invoice_number',
            value: invoice.invoice_number,
          },
        ],
      },
    });

    if (!paystackResponse.status) {
      throw new AppError(paystackResponse.message || 'Payment initialization failed', 400);
    }

    // Store payment reference
    await query(
      'UPDATE invoices SET payment_reference = $1 WHERE id = $2',
      [paymentReference, invoiceId]
    );

    res.json({
      success: true,
      data: {
        authorization_url: paystackResponse.data.authorization_url,
        reference: paymentReference,
        access_code: paystackResponse.data.access_code,
      },
    });
  })
);

// @route   GET /api/payments/verify/:reference
// @desc    Verify Paystack payment
// @access  Private
router.get(
  '/verify/:reference',
  authenticate,
  asyncHandler(async (req, res) => {
    const { reference } = req.params;

    // Verify with Paystack
    const verification = await paystack.verifyTransaction(reference);

    if (!verification.status) {
      throw new AppError('Payment verification failed', 400);
    }

    const transaction = verification.data;

    // Find invoice by reference
    const invoiceResult = await query(
      `SELECT i.*, COALESCE(a.type_label, 'Price Quote') as type_label, u.email, u.first_name
       FROM invoices i
       LEFT JOIN applications a ON i.application_id = a.id
       JOIN users u ON i.client_id = u.id
       WHERE i.payment_reference = $1`,
      [reference]
    );

    if (invoiceResult.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const invoice = invoiceResult.rows[0];

    // Check if already processed
    if (invoice.status === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        data: { status: 'paid' },
      });
    }

    // Process successful payment
    if (transaction.status === 'success') {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Update invoice
        await client.query(
          `UPDATE invoices 
           SET status = 'paid',
               payment_method = 'paystack',
               paid_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [invoice.id]
        );

        // Update application progress
        await client.query(
          `UPDATE applications 
           SET progress = 50,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [invoice.application_id]
        );

        // Create notification
        const notificationResult = await client.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            invoice.client_id,
            'Payment Successful',
            `Your payment of ${invoice.currency} ${parseFloat(invoice.amount).toLocaleString()} has been received.`,
            'success',
          ]
        );

        await client.query('COMMIT');

        // Send email receipt
        await sendEmail(invoice.email, 'paymentReceipt', {
          firstName: invoice.first_name,
          invoiceNumber: invoice.invoice_number,
          applicationType: invoice.type_label,
          amount: parseFloat(invoice.amount),
          currency: invoice.currency,
          paymentMethod: 'Paystack',
          paymentReference: reference,
          paidAt: new Date(),
          receiptUrl: `${FRONTEND_URL}/dashboard/invoices`,
        });

        // Send real-time notification
        notifyPaymentReceived(invoice.client_id, {
          invoiceId: invoice.id,
          amount: parseFloat(invoice.amount),
          currency: invoice.currency,
        });

        notifyUser(invoice.client_id, notificationResult.rows[0]);

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            status: 'paid',
            amount: transaction.amount / 100,
            reference: transaction.reference,
            paid_at: new Date(),
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      res.json({
        success: false,
        message: `Payment ${transaction.status}`,
        data: { status: transaction.status },
      });
    }
  })
);

// @route   POST /api/payments/webhook
// @desc    Paystack webhook handler
// @access  Public (Paystack only)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', secret)
      .update(req.body)
      .digest('hex');

    if (hash !== signature) {
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(req.body);

    console.log('📩 Paystack webhook received:', event.event);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, status } = event.data;

      if (status === 'success') {
        // Find and update invoice
        const invoiceResult = await query(
          'SELECT * FROM invoices WHERE payment_reference = $1',
          [reference]
        );

        if (invoiceResult.rows.length > 0) {
          const invoice = invoiceResult.rows[0];

          if (invoice.status !== 'paid') {
            await query(
              `UPDATE invoices 
               SET status = 'paid',
                   payment_method = 'paystack',
                   paid_at = CURRENT_TIMESTAMP
               WHERE id = $1`,
              [invoice.id]
            );

            // Create notification
            await query(
              `INSERT INTO notifications (user_id, title, message, type)
               VALUES ($1, $2, $3, $4)`,
              [
                invoice.client_id,
                'Payment Successful',
                `Your payment has been confirmed.`,
                'success',
              ]
            );
          }
        }
      }
    }

    res.status(200).send('OK');
  })
);

// @route   POST /api/payments/demo
// @desc    Demo payment for testing (simulates successful payment)
// @access  Private
router.post(
  '/demo',
  authenticate,
  asyncHandler(async (req, res) => {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      throw new AppError('Invoice ID is required', 400);
    }

    // Get invoice details
    const invoiceResult = await query(
      `SELECT i.*, a.type_label, u.email, u.first_name
       FROM invoices i
       JOIN applications a ON i.application_id = a.id
       JOIN users u ON i.client_id = u.id
       WHERE i.id = $1 AND i.client_id = $2`,
      [invoiceId, req.user.id]
    );

    if (invoiceResult.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const invoice = invoiceResult.rows[0];

    if (invoice.status === 'paid') {
      return res.json({
        success: true,
        message: 'Invoice already paid',
        data: { status: 'paid' },
      });
    }

    // Process demo payment
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update invoice
      await client.query(
        `UPDATE invoices 
         SET status = 'paid',
             payment_method = 'demo',
             payment_reference = 'DEMO-' + $1,
             paid_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [Date.now(), invoice.id]
      );

      // Update application progress
      await client.query(
        `UPDATE applications 
         SET progress = 50,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [invoice.application_id]
      );

      // Create notification
      const notificationResult = await client.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          invoice.client_id,
          'Payment Successful (Demo)',
          `Your payment of ${invoice.currency} ${parseFloat(invoice.amount).toLocaleString()} has been received (Demo Payment).`,
          'success',
        ]
      );

      await client.query('COMMIT');

      // Send real-time notification
      notifyPaymentReceived(invoice.client_id, {
        invoiceId: invoice.id,
        amount: parseFloat(invoice.amount),
        currency: invoice.currency,
      });

      notifyUser(invoice.client_id, notificationResult.rows[0]);

      res.json({
        success: true,
        message: 'Demo payment successful',
        data: {
          status: 'paid',
          amount: invoice.amount,
          reference: 'DEMO-' + Date.now(),
          paid_at: new Date(),
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
);

// @route   GET /api/payments/banks
// @desc    List available banks
// @access  Private
router.get(
  '/banks',
  authenticate,
  asyncHandler(async (req, res) => {
    const { country = 'nigeria' } = req.query;
    const banks = await paystack.listBanks(country);

    res.json({
      success: true,
      data: banks.data || [],
    });
  })
);

// @route   GET /api/payments/resolve-account
// @desc    Resolve account number
// @access  Private
router.get(
  '/resolve-account',
  authenticate,
  asyncHandler(async (req, res) => {
    const { account_number, bank_code } = req.query;

    if (!account_number || !bank_code) {
      throw new AppError('Account number and bank code are required', 400);
    }

    const result = await paystack.resolveAccount(account_number, bank_code);

    res.json({
      success: result.status,
      data: result.data,
    });
  })
);

// @route   POST /api/payments/transfer
// @desc    Initiate transfer (Admin only)
// @access  Private (Admin)
router.post(
  '/transfer',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { amount, recipient_code, reason, reference } = req.body;

    const transfer = await paystack.initiateTransfer({
      source: 'balance',
      amount,
      recipient: recipient_code,
      reason,
      reference,
    });

    res.json({
      success: transfer.status,
      data: transfer.data,
    });
  })
);

module.exports = router;
