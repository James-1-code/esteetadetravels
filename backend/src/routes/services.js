const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all service prices
router.get('/prices', authenticate, asyncHandler(async (req, res) => {
  const { service_type, country } = req.query;
  
  let sql = 'SELECT * FROM service_prices WHERE is_active = true';
  const params = [];
  let paramIndex = 1;
  
  if (service_type) {
    sql += ` AND service_type = $${paramIndex}`;
    params.push(service_type);
    paramIndex++;
  }
  
  if (country) {
    sql += ` AND (country = $${paramIndex} OR country IS NULL)`;
    params.push(country);
    paramIndex++;
  }
  
  sql += ' ORDER BY service_type, country';
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows.map(row => ({
      id: row.id,
      serviceType: row.service_type,
      country: row.country,
      workType: row.work_type,
      websiteType: row.website_type,
      priceAmount: parseFloat(row.price_amount),
      currency: row.currency,
      isActive: row.is_active,
    })),
  });
}));

// Get price for a specific service (with country/type)
router.get('/prices/:serviceType', authenticate, asyncHandler(async (req, res) => {
  const { serviceType } = req.params;
  const { country, work_type, website_type } = req.query;
  
  let sql = 'SELECT * FROM service_prices WHERE service_type = $1 AND is_active = true';
  const params = [serviceType];
  let paramIndex = 2;
  
  if (country) {
    sql += ` AND (country = $${paramIndex} OR country IS NULL)`;
    params.push(country);
    paramIndex++;
  }
  
  if (work_type) {
    sql += ` AND (work_type = $${paramIndex} OR work_type IS NULL)`;
    params.push(work_type);
    paramIndex++;
  }
  
  if (website_type) {
    sql += ` AND (website_type = $${paramIndex} OR website_type IS NULL)`;
    params.push(website_type);
  }
  
  sql += ' ORDER BY country NULLS LAST, work_type NULLS LAST LIMIT 1';
  
  const result = await query(sql, params);
  
  if (result.rows.length === 0) {
    // Get base price if no specific price found
    const baseResult = await query(
      'SELECT * FROM service_prices WHERE service_type = $1 AND country IS NULL AND is_active = true LIMIT 1',
      [serviceType]
    );
    
    if (baseResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Price not configured for this service',
      });
    }
    
    return res.json({
      success: true,
      data: {
        id: baseResult.rows[0].id,
        serviceType: baseResult.rows[0].service_type,
        priceAmount: parseFloat(baseResult.rows[0].price_amount),
        currency: baseResult.rows[0].currency,
      },
    });
  }
  
  res.json({
    success: true,
    data: {
      id: result.rows[0].id,
      serviceType: result.rows[0].service_type,
      country: result.rows[0].country,
      workType: result.rows[0].work_type,
      websiteType: result.rows[0].website_type,
      priceAmount: parseFloat(result.rows[0].price_amount),
      currency: result.rows[0].currency,
    },
  });
}));

// Admin: Update or create service price
router.put('/prices/:serviceType', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { serviceType } = req.params;
  const { country, work_type, website_type, price_amount, currency, is_active } = req.body;
  
  const result = await query(
    `INSERT INTO service_prices (service_type, country, work_type, website_type, price_amount, currency, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (service_type, country, work_type, website_type)
     DO UPDATE SET price_amount = $5, currency = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [serviceType, country || null, work_type || null, website_type || null, price_amount, currency || 'NGN', is_active !== false]
  );
  
  res.json({
    success: true,
    message: 'Service price updated successfully',
    data: {
      id: result.rows[0].id,
      serviceType: result.rows[0].service_type,
      country: result.rows[0].country,
      workType: result.rows[0].work_type,
      websiteType: result.rows[0].website_type,
      priceAmount: parseFloat(result.rows[0].price_amount),
      currency: result.rows[0].currency,
      isActive: result.rows[0].is_active,
    },
  });
}));

// Get all website types
router.get('/website-types', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM website_types WHERE is_active = true ORDER BY base_price'
  );
  
  res.json({
    success: true,
    data: result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      basePrice: parseFloat(row.base_price),
    })),
  });
}));

// Create price request (for flight/hotel)
router.post('/price-requests', authenticate, asyncHandler(async (req, res) => {
  const { application_id, service_type, details } = req.body;
  const clientId = req.user.id;
  
  const result = await query(
    `INSERT INTO price_requests (application_id, client_id, service_type, details, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [application_id || null, clientId, service_type, JSON.stringify(details || {})]
  );
  
  // Create notification for admin
  await query(
    `INSERT INTO notifications (user_id, title, message, type)
     SELECT id, 'Price Request', 'New price request for ' || $1 || ' from ' || $2, 'info'
     FROM users WHERE role = 'admin'`,
    [service_type, req.user.email]
  );
  
  res.status(201).json({
    success: true,
    message: 'Price request submitted successfully. You will be notified once admin provides the quote.',
    data: {
      id: result.rows[0].id,
      serviceType: result.rows[0].service_type,
      status: result.rows[0].status,
    },
  });
}));

// Get price requests (for client - their own requests, for admin - all)
router.get('/price-requests', authenticate, asyncHandler(async (req, res) => {
  const { status, service_type } = req.query;
  
  let sql = `SELECT pr.*, u.first_name, u.last_name, u.email 
             FROM price_requests pr 
             JOIN users u ON pr.client_id = u.id 
             WHERE 1=1`;
  const params = [];
  let paramIndex = 1;
  
  // Filter by user role - clients see only their own, agents see all clients', admin sees all
  if (req.user.role === 'client') {
    sql += ` AND pr.client_id = $${paramIndex}`;
    params.push(req.user.id);
    paramIndex++;
  }
  // Agents and admins can see all price requests
  
  if (status) {
    sql += ` AND pr.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  if (service_type) {
    sql += ` AND pr.service_type = $${paramIndex}`;
    params.push(service_type);
    paramIndex++;
  }
  
  sql += ' ORDER BY pr.created_at DESC';
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows.map(row => ({
      id: row.id,
      applicationId: row.application_id,
      clientId: row.client_id,
      clientName: `${row.first_name} ${row.last_name}`,
      clientEmail: row.email,
      serviceType: row.service_type,
      details: row.details,
      requestedPrice: row.requested_price ? parseFloat(row.requested_price) : null,
      adminPrice: row.admin_price ? parseFloat(row.admin_price) : null,
      status: row.status,
      adminNotes: row.admin_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}));

// Admin: Respond to price request OR Client: Accept or reject price quote
router.put('/price-requests/:id/respond', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { admin_price, admin_notes, accept } = req.body;
  
  // Get the request first
  const requestResult = await query('SELECT * FROM price_requests WHERE id = $1', [id]);
  
  if (requestResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Price request not found',
    });
  }
  
  const request = requestResult.rows[0];
  
  // Verify ownership for clients
  if (req.user.role === 'client' && request.client_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }
  
  // Admin response (sending quote)
  if (req.user.role === 'admin' && admin_price !== undefined) {
    const result = await query(
      `UPDATE price_requests 
       SET admin_price = $1, admin_notes = $2, status = 'quoted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [admin_price, admin_notes, id]
    );
    
    // Notify the client
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, 'Price Quote Available', 'Your price quote for ' || $2 || ' is now available. Please review and accept.', 'info', '/dashboard/price-requests')`,
      [request.client_id, request.service_type]
    );
    
    return res.json({
      success: true,
      message: 'Price quote sent to client',
      data: {
        id: result.rows[0].id,
        adminPrice: parseFloat(result.rows[0].admin_price),
        status: result.rows[0].status,
      },
    });
  }
  
// Client response (accept or reject quote)
  if (req.user.role === 'client' && accept !== undefined) {
    const newStatus = accept ? 'accepted' : 'rejected';
    
    const result = await query(
      `UPDATE price_requests 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newStatus, id]
    );
    
    let invoiceId = null;
    
    if (accept) {
      // Always create invoice for accepted quote
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const invoiceResult = await query(
        `INSERT INTO invoices (application_id, client_id, invoice_number, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, 'unpaid')
         RETURNING id`,
        [request.application_id || null, request.client_id, invoiceNumber, Number(request.admin_price || 0), 'NGN']
      );
      
      invoiceId = invoiceResult.rows[0].id;
      
      // Update application amount if exists
      if (request.application_id) {
        await query(
          `UPDATE applications 
           SET amount = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [request.admin_price, request.application_id]
        );
      }
    }
    
    return res.json({
      success: true,
      message: accept ? 'Price accepted. Ready for payment.' : 'Price quote rejected.',
      data: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        invoiceId: invoiceId,  // New field for frontend
      },
    });
  }
  
  return res.status(400).json({
    success: false,
    message: 'Invalid request. Admin must provide admin_price, client must provide accept boolean.',
  });
}));

module.exports = router;

