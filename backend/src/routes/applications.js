const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { createApplicationValidator, updateApplicationValidator, paginationValidator, idParamValidator } = require('../middleware/validator');
const { notifyApplicationUpdate, notifyUser } = require('../services/socket');

const typeLabels = {
  cv: 'CV / Resume Maker',
  study: 'Study Abroad Application',
  work: 'Work Visa Application',
  flight: 'Flight Booking',
  hotel: 'Hotel Reservation',
  document: 'Document Processing',
};

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}-${random}`;
};

router.get('/', authenticate, paginationValidator, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const offset = (page - 1) * limit;
  
  let sql = `SELECT a.*, u.first_name as client_first_name, u.last_name as client_last_name, u.email as client_email, ag.first_name as agent_first_name, ag.last_name as agent_last_name FROM applications a JOIN users u ON a.client_id = u.id LEFT JOIN users ag ON a.agent_id = ag.id WHERE 1=1`;
  
  const params = [];
  let paramIndex = 1;
  
  if (req.user.role === 'client') {
    sql += ` AND a.client_id = $${paramIndex}`;
    params.push(req.user.id);
    paramIndex++;
  } else if (req.user.role === 'agent') {
    sql += ` AND (a.agent_id = $${paramIndex} OR a.client_id IN (SELECT id FROM users WHERE referred_by = $${paramIndex}))`;
    params.push(req.user.id);
    paramIndex++;
  }
  
  if (status) {
    sql += ` AND a.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  if (search) {
    sql += ` AND (a.type_label ILIKE $${paramIndex} OR a.id::text ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  const countResult = await query(`SELECT COUNT(*) FROM (${sql}) as count_query`, params);
  const total = parseInt(countResult.rows[0].count);
  
  sql += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: {
      applications: result.rows.map(app => ({
        id: app.id,
        clientId: app.client_id,
        agentId: app.agent_id,
        type: app.application_type,
        typeLabel: app.type_label,
        amount: parseFloat(app.amount),
        currency: app.currency,
        status: app.status,
        progress: app.progress,
        documents: app.documents || [],
        formData: app.form_data,
        notes: app.notes,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
        client: { firstName: app.client_first_name, lastName: app.client_last_name, email: app.client_email },
        agent: app.agent_first_name ? { firstName: app.agent_first_name, lastName: app.agent_last_name } : null,
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    },
  });
}));

router.get('/:id', authenticate, idParamValidator, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(`SELECT a.*, u.first_name as client_first_name, u.last_name as client_last_name, u.email as client_email, ag.first_name as agent_first_name, ag.last_name as agent_last_name FROM applications a JOIN users u ON a.client_id = u.id LEFT JOIN users ag ON a.agent_id = ag.id WHERE a.id = $1`, [id]);
  
  if (result.rows.length === 0) {
    throw new AppError('Application not found', 404);
  }
  
  const app = result.rows[0];
  
  if (req.user.role === 'client' && app.client_id !== req.user.id) {
    throw new AppError('Access denied', 403);
  }
  
  if (req.user.role === 'agent' && app.agent_id !== req.user.id) {
    const clientResult = await query('SELECT referred_by FROM users WHERE id = $1', [app.client_id]);
    if (clientResult.rows[0]?.referred_by !== req.user.id) {
      throw new AppError('Access denied', 403);
    }
  }
  
  // Get documents with IDs for downloads
  const docsResult = await query('SELECT id, original_name, mime_type, size, uploaded_at FROM documents WHERE application_id = $1', [id]);
  
  const documents = docsResult.rows.map(doc => ({
    id: doc.id,
    filename: doc.original_name,
    mimeType: doc.mime_type,
    size: doc.size,
    uploadedAt: doc.uploaded_at,
  }));
  
  res.json({
    success: true,
    data: {
      id: app.id,
      clientId: app.client_id,
      agentId: app.agent_id,
      type: app.application_type,
      typeLabel: app.type_label,
      amount: parseFloat(app.amount),
      currency: app.currency,
      status: app.status,
      progress: app.progress,
      documents: documents,
      formData: app.form_data,
      notes: app.notes,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      client: { firstName: app.client_first_name, lastName: app.client_last_name, email: app.client_email },
      agent: app.agent_first_name ? { firstName: app.agent_first_name, lastName: app.agent_last_name } : null,
    },
  });
}));

router.post('/', authenticate, createApplicationValidator, asyncHandler(async (req, res) => {
  const { applicationType, typeLabel, amount, currency, formData, documents } = req.body;
  
  const clientId = req.user.role === 'agent' ? formData?.clientId || req.user.id : req.user.id;
  const agentId = req.user.role === 'agent' ? req.user.id : null;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const appResult = await client.query(`INSERT INTO applications (client_id, agent_id, application_type, type_label, amount, currency, form_data, documents, progress) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [clientId, agentId, applicationType, typeLabel || typeLabels[applicationType], amount, currency, JSON.stringify(formData), documents || [], 10]);
    
    const application = appResult.rows[0];
    
    const invoiceResult = await client.query(`INSERT INTO invoices (application_id, client_id, invoice_number, amount, currency, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [application.id, clientId, generateInvoiceNumber(), amount, currency, 'unpaid']);
    
    await client.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`, [clientId, 'Application Submitted', `Your ${typeLabel || typeLabels[applicationType]} has been submitted successfully.`, 'success', `/applications/${application.id}`]);
    
    if (agentId) {
      await client.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`, [agentId, 'New Application', `A new application has been submitted for your client.`, 'info', `/applications/${application.id}`]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: { id: application.id, clientId: application.client_id, agentId: application.agent_id, type: application.application_type, typeLabel: application.type_label, amount: parseFloat(application.amount), currency: application.currency, status: application.status, progress: application.progress, documents: application.documents || [], formData: application.form_data, createdAt: application.created_at },
        invoice: { id: invoiceResult.rows[0].id, invoiceNumber: invoiceResult.rows[0].invoice_number, amount: parseFloat(invoiceResult.rows[0].amount), currency: invoiceResult.rows[0].currency, status: invoiceResult.rows[0].status },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

router.put('/:id', authenticate, authorize('admin', 'agent'), updateApplicationValidator, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, progress, notes } = req.body;
  
  const existingResult = await query('SELECT * FROM applications WHERE id = $1', [id]);
  
  if (existingResult.rows.length === 0) {
    throw new AppError('Application not found', 404);
  }
  
  const existingApp = existingResult.rows[0];
  
  if (req.user.role === 'agent') {
    const clientResult = await query('SELECT referred_by FROM users WHERE id = $1', [existingApp.client_id]);
    if (existingApp.agent_id !== req.user.id && clientResult.rows[0]?.referred_by !== req.user.id) {
      throw new AppError('Access denied', 403);
    }
  }
  
  const result = await query(`UPDATE applications SET status = COALESCE($1, status), progress = COALESCE($2, progress), notes = COALESCE($3, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`, [status, progress, notes, id]);
  
  const application = result.rows[0];
  
  // Emit socket notification for status change
  if (status && status !== existingApp.status) {
    const statusMessages = {
      pending: 'Your application is now pending review.',
      approved: 'Great news! Your application has been approved.',
      rejected: 'We regret to inform you that your application was rejected.',
      completed: 'Your application has been completed successfully!',
    };
    
    await query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`, [application.client_id, 'Application Update', statusMessages[status] || 'Your application status has been updated.', status === 'approved' || status === 'completed' ? 'success' : status === 'rejected' ? 'error' : 'info', `/applications/${application.id}`]);
    
    // Send real-time notification via socket
    try {
      notifyApplicationUpdate(application.client_id, {
        id: application.id,
        typeLabel: application.type_label,
        status: application.status,
        progress: application.progress,
      });
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }
  }
  
  res.json({ success: true, message: 'Application updated successfully', data: { id: application.id, status: application.status, progress: application.progress, notes: application.notes, updatedAt: application.updated_at } });
}));

router.delete('/:id', authenticate, authorize('admin'), idParamValidator, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM applications WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    throw new AppError('Application not found', 404);
  }
  
  res.json({ success: true, message: 'Application deleted successfully' });
}));

router.get('/stats/overview', authenticate, asyncHandler(async (req, res) => {
  let sql = `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending, COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved, COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected, SUM(amount) as total_revenue FROM applications`;
  
  const params = [];
  
  if (req.user.role === 'client') {
    sql += ' WHERE client_id = $1';
    params.push(req.user.id);
  } else if (req.user.role === 'agent') {
    sql += ' WHERE agent_id = $1 OR client_id IN (SELECT id FROM users WHERE referred_by = $1)';
    params.push(req.user.id);
  }
  
  const result = await query(sql, params);
  const stats = result.rows[0];
  
  let monthlySql = `SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM applications`;
  
  if (req.user.role === 'client') {
    monthlySql += ' WHERE client_id = $1';
  } else if (req.user.role === 'agent') {
    monthlySql += ' WHERE agent_id = $1 OR client_id IN (SELECT id FROM users WHERE referred_by = $1)';
  }
  
  monthlySql += ` GROUP BY DATE_TRUNC('month', created_at) ORDER BY month DESC LIMIT 6`;
  
  const monthlyResult = await query(monthlySql, params);
  
  res.json({
    success: true,
    data: {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      approved: parseInt(stats.approved),
      completed: parseInt(stats.completed),
      rejected: parseInt(stats.rejected),
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      monthlyData: monthlyResult.rows.map(row => ({ month: row.month, count: parseInt(row.count) })),
    },
  });
}));

module.exports = router;

