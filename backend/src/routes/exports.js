const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/applications', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT a.*, u.first_name as client_first_name, u.last_name as client_last_name, u.email as client_email FROM applications a JOIN users u ON a.client_id = u.id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND a.status = $1'; params.push(status); }
  sql += ' ORDER BY a.created_at DESC';
  const result = await query(sql, params);
  const csv = 'ID,Type,Amount,Currency,Status,Client\n' + result.rows.map(r => r.id + ',' + r.type_label + ',' + r.amount + ',' + r.currency + ',' + r.status + ',' + r.client_first_name).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
  res.send(csv);
}));

router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await query('SELECT id, email, first_name, last_name, role FROM users ORDER BY created_at DESC');
  const csv = 'ID,Email,Name,Role\n' + result.rows.map(r => r.id + ',' + r.email + ',' + r.first_name + ' ' + r.last_name + ',' + r.role).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
  res.send(csv);
}));

router.get('/invoices', authenticate, asyncHandler(async (req, res) => {
  const result = await query('SELECT i.*, a.type_label FROM invoices i JOIN applications a ON i.application_id = a.id ORDER BY i.created_at DESC');
  const csv = 'Invoice Number,Type,Amount,Currency,Status\n' + result.rows.map(r => r.invoice_number + ',' + r.type_label + ',' + r.amount + ',' + r.currency + ',' + r.status).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
  res.send(csv);
}));

// @route   GET /api/invoices/export
// @desc    Export all invoices to CSV (for payment page export button)
// @access  Private (Admin/Agent)
router.get('/invoices/all', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT i.*, 
           a.type_label as application_type,
           u.first_name as client_first_name,
           u.last_name as client_last_name,
           u.email as client_email
    FROM invoices i 
    JOIN applications a ON i.application_id = a.id 
    JOIN users u ON i.client_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status && status !== 'all') {
    sql += ' AND i.status = $1';
    params.push(status);
  }
  
  sql += ' ORDER BY i.created_at DESC';
  
  const result = await query(sql, params);
  
  const csv = 'Invoice Number,Client Name,Client Email,Service Type,Amount,Currency,Status,Payment Method,Payment Reference,Date\n' + 
    result.rows.map(r => 
      `"${r.invoice_number}","${r.client_first_name} ${r.client_last_name}","${r.client_email}","${r.application_type}",${r.amount},"${r.currency}","${r.status}","${r.payment_method || 'N/A'}","${r.payment_reference || 'N/A'}","${new Date(r.created_at).toLocaleDateString()}"`
    ).join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=invoices-export.csv');
  res.send(csv);
}));

module.exports = router;

