const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { paginationValidator, idParamValidator } = require('../middleware/validator');

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private
router.get(
  '/',
  authenticate,
  paginationValidator,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT i.*,
             a.type_label as application_type,
             u.first_name as client_first_name,
             u.last_name as client_last_name
      FROM invoices i
      JOIN applications a ON i.application_id = a.id
      JOIN users u ON i.client_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'client') {
      sql += ` AND i.client_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    } else if (req.user.role === 'agent') {
      sql += ` AND (a.agent_id = $${paramIndex} OR i.client_id IN (SELECT id FROM users WHERE referred_by = $${paramIndex}))`;
      params.push(req.user.id);
      paramIndex++;
    }

    if (status) {
      sql += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) as count_query`, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        invoices: result.rows.map(invoice => ({
          id: invoice.id,
          applicationId: invoice.application_id,
          clientId: invoice.client_id,
          invoiceNumber: invoice.invoice_number,
          amount: parseFloat(invoice.amount),
          currency: invoice.currency,
          status: invoice.status,
          paymentMethod: invoice.payment_method,
          paymentReference: invoice.payment_reference,
          paidAt: invoice.paid_at,
          createdAt: invoice.created_at,
          applicationType: invoice.application_type,
          client: {
            firstName: invoice.client_first_name,
            lastName: invoice.client_last_name,
          },
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private
router.get(
  '/:id',
  authenticate,
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
      `SELECT i.*,
              a.type_label as application_type,
              a.application_type as app_type,
              u.first_name as client_first_name,
              u.last_name as client_last_name,
              u.email as client_email,
              u.phone as client_phone
       FROM invoices i
       JOIN applications a ON i.application_id = a.id
       JOIN users u ON i.client_id = u.id
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const invoice = result.rows[0];

    if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
      throw new AppError('Access denied', 403);
    }

    if (req.user.role === 'agent') {
      const appResult = await query(
        'SELECT agent_id FROM applications WHERE id = $1',
        [invoice.application_id]
      );

      if (appResult.rows[0]?.agent_id !== req.user.id) {
        const clientResult = await query(
          'SELECT referred_by FROM users WHERE id = $1',
          [invoice.client_id]
        );

        if (clientResult.rows[0]?.referred_by !== req.user.id) {
          throw new AppError('Access denied', 403);
        }
      }
    }

    res.json({
      success: true,
      data: {
        id: invoice.id,
        applicationId: invoice.application_id,
        clientId: invoice.client_id,
        invoiceNumber: invoice.invoice_number,
        amount: parseFloat(invoice.amount),
        currency: invoice.currency,
        status: invoice.status,
        paymentMethod: invoice.payment_method,
        paymentReference: invoice.payment_reference,
        paidAt: invoice.paid_at,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        applicationType: invoice.application_type,
        appType: invoice.app_type,
        client: {
          firstName: invoice.client_first_name,
          lastName: invoice.client_last_name,
          email: invoice.client_email,
          phone: invoice.client_phone,
        },
      },
    });
  })
);

// @route   POST /api/invoices/:id/pay
// @desc    Process payment for invoice
// @access  Private (Client)
router.post(
  '/:id/pay',
  authenticate,
  authorize('client'),
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentMethod, paymentReference } = req.body;

    const invoiceResult = await query(
      'SELECT * FROM invoices WHERE id = $1 AND client_id = $2',
      [id, req.user.id]
    );

    if (invoiceResult.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const invoice = invoiceResult.rows[0];

    if (invoice.status === 'paid') {
      throw new AppError('Invoice is already paid', 400);
    }

    const result = await query(
      `UPDATE invoices
       SET status = 'paid',
           payment_method = $1,
           payment_reference = $2,
           paid_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [paymentMethod || 'card', paymentReference || `PAY-${Date.now()}`, id]
    );

    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'Payment Successful', `Your payment of ${invoice.currency} ${invoice.amount} has been received.`, 'success']
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        paidAt: result.rows[0].paid_at,
      },
    });
  })
);

// @route   GET /api/invoices/stats/overview
// @desc    Get invoice statistics
// @access  Private
router.get(
  '/stats/overview',
  authenticate,
  asyncHandler(async (req, res) => {
    let sql = `
      SELECT
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_count,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as outstanding_amount
      FROM invoices
    `;

    const params = [];

    if (req.user.role === 'client') {
      sql += ' WHERE client_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'agent') {
      sql += ` WHERE client_id IN (
        SELECT id FROM users WHERE referred_by = $1
        UNION
        SELECT client_id FROM applications WHERE agent_id = $1
      )`;
      params.push(req.user.id);
    }

    const result = await query(sql, params);
    const stats = result.rows[0];

    let monthlySql = `
      SELECT
        DATE_TRUNC('month', created_at) as month,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as revenue
      FROM invoices
    `;

    if (req.user.role === 'client') {
      monthlySql += ' WHERE client_id = $1';
    } else if (req.user.role === 'agent') {
      monthlySql += ` WHERE client_id IN (
        SELECT id FROM users WHERE referred_by = $1
        UNION
        SELECT client_id FROM applications WHERE agent_id = $1
      )`;
    }

    monthlySql += `
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 6
    `;

    const monthlyResult = await query(monthlySql, params);

    res.json({
      success: true,
      data: {
        totalInvoices: parseInt(stats.total_invoices),
        paidCount: parseInt(stats.paid_count),
        unpaidCount: parseInt(stats.unpaid_count),
        refundedCount: parseInt(stats.refunded_count),
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        outstandingAmount: parseFloat(stats.outstanding_amount) || 0,
        monthlyData: monthlyResult.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue) || 0,
        })),
      },
    });
  })
);

// @route   GET /api/invoices/:id/download
// @desc    Download invoice as professional HTML receipt
// @access  Private
router.get(
  '/:id/download',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    let result;
    if (isUUID) {
      result = await query(
        `SELECT i.*, a.type_label as application_type, u.first_name as client_first_name, u.last_name as client_last_name, u.email as client_email
         FROM invoices i JOIN applications a ON i.application_id = a.id JOIN users u ON i.client_id = u.id WHERE i.id = $1`,
        [id]
      );
    } else {
      result = await query(
        `SELECT i.*, a.type_label as application_type, u.first_name as client_first_name, u.last_name as client_last_name, u.email as client_email
         FROM invoices i JOIN applications a ON i.application_id = a.id JOIN users u ON i.client_id = u.id WHERE i.invoice_number = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const invoice = result.rows[0];

    if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
      throw new AppError('Access denied', 403);
    }

    if (req.user.role === 'agent') {
      const appResult = await query('SELECT agent_id FROM applications WHERE id = $1', [invoice.application_id]);
      if (appResult.rows[0]?.agent_id !== req.user.id) {
        const clientResult = await query('SELECT referred_by FROM users WHERE id = $1', [invoice.client_id]);
        if (clientResult.rows[0]?.referred_by !== req.user.id) {
          throw new AppError('Access denied', 403);
        }
      }
    }

    // Generate professional HTML receipt
    const invoiceContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${invoice.invoice_number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .receipt-header {
            background: linear-gradient(135deg, #0a9396 0%, #0d7377 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .receipt-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: 2px;
        }
        .receipt-header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .receipt-body {
            padding: 30px;
        }
        .receipt-title {
            text-align: center;
            font-size: 24px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #0a9396;
        }
        .info-section {
            margin-bottom: 25px;
        }
        .info-section h3 {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #0a9396;
        }
        .info-box label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .info-box span {
            display: block;
            font-size: 16px;
            font-weight: 600;
            color: #1a1a2e;
        }
        .amount-section {
            background: linear-gradient(135deg, #e8f5f5 0%, #d0eef0 100%);
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin: 25px 0;
        }
        .amount-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .amount-value {
            font-size: 42px;
            font-weight: 700;
            color: #0a9396;
        }
        .amount-value.naira::before {
            content: "₦";
        }
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .status-paid {
            background: #d4edda;
            color: #155724;
        }
        .status-unpaid {
            background: #fff3cd;
            color: #856404;
        }
        .status-refunded {
            background: #f8d7da;
            color: #721c24;
        }
        .transaction-details {
            margin-top: 25px;
        }
        .transaction-details h3 {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        .transaction-table {
            width: 100%;
            border-collapse: collapse;
        }
        .transaction-table th,
        .transaction-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .transaction-table th {
            background: #f8f9fa;
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        .transaction-table td {
            font-size: 14px;
            color: #1a1a2e;
        }
        .transaction-table tr:last-child td {
            border-bottom: none;
        }
        .footer {
            background: #1a1a2e;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            opacity: 0.8;
        }
        .footer .company-info {
            margin-top: 10px;
            font-size: 11px;
            opacity: 0.6;
        }
        .print-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px 24px;
            background: #0a9396;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
        }
        .print-btn:hover {
            background: #0d7377;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .receipt-container {
                box-shadow: none;
            }
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="receipt-header">
            <h1>ESTEETADE TRAVELS</h1>
            <p>Your Trusted Travel Partner</p>
        </div>
        
        <div class="receipt-body">
            <div class="receipt-title">OFFICIAL RECEIPT</div>
            
            <div class="info-section">
                <div class="info-grid">
                    <div class="info-box">
                        <label>Receipt Number</label>
                        <span>${invoice.invoice_number}</span>
                    </div>
                    <div class="info-box">
                        <label>Date Issued</label>
                        <span>${new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="info-box">
                        <label>Customer Name</label>
                        <span>${invoice.client_first_name} ${invoice.client_last_name}</span>
                    </div>
                    <div class="info-box">
                        <label>Customer Email</label>
                        <span>${invoice.client_email}</span>
                    </div>
                </div>
            </div>
            
            <div class="amount-section">
                <div class="amount-label">Amount Paid</div>
                <div class="amount-value naira">${parseFloat(invoice.amount).toLocaleString()}</div>
                <div style="margin-top: 15px;">
                    <span class="status-badge ${invoice.status === 'paid' ? 'status-paid' : invoice.status === 'unpaid' ? 'status-unpaid' : 'status-refunded'}">${invoice.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="transaction-details">
                <h3>Transaction Details</h3>
                <table class="transaction-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Service Type</td>
                            <td><strong>${invoice.application_type}</strong></td>
                        </tr>
                        <tr>
                            <td>Currency</td>
                            <td>${invoice.currency}</td>
                        </tr>
                        <tr>
                            <td>Payment Method</td>
                            <td>${invoice.payment_method ? invoice.payment_method.toUpperCase() : 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Payment Reference</td>
                            <td>${invoice.payment_reference || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Payment Date</td>
                            <td>${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <button class="print-btn" onclick="window.print()">Print Receipt</button>
        </div>
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <div class="company-info">
                ESTEETADE TRAVELS | www.esteetade.com | info@esteetade.com | +234 XXX XXX XXXX
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${invoice.invoice_number}.html"`);
    res.send(invoiceContent);
  })
);

module.exports = router;
