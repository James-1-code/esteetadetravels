const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { updateUserValidator, paginationValidator, idParamValidator } = require('../middleware/validator');
const { notifyUser } = require('../services/socket');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin, Agent)
router.get(
  '/',
  authenticate,
  authorize('admin', 'agent'),
  paginationValidator,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, 
             u.referral_code, u.email_verified, u.admin_approved, u.avatar_url,
             u.created_at,
             (SELECT COUNT(*) FROM applications WHERE client_id = u.id) as application_count,
             (SELECT COUNT(*) FROM users WHERE referred_by = u.id) as referral_count
      FROM users u
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Agents can only see their referred clients
    if (req.user.role === 'agent') {
      sql += ` AND (u.referred_by = $${paramIndex} OR u.id = $${paramIndex})`;
      params.push(req.user.id);
      paramIndex++;
    }
    
    // Filter by role
    if (role) {
      sql += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    // Filter by status
    if (status === 'pending') {
      sql += ` AND u.role = 'agent' AND u.admin_approved = false`;
    } else if (status === 'active') {
      sql += ` AND (u.role != 'agent' OR u.admin_approved = true)`;
    }
    
    // Search
    if (search) {
      sql += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Count total
    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) as count_query`, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    sql += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: {
        users: result.rows.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          referralCode: user.referral_code,
          emailVerified: user.email_verified,
          adminApproved: user.admin_approved,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          applicationCount: parseInt(user.application_count),
          referralCount: parseInt(user.referral_count),
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

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin, Agent for their clients)
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'agent'),
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM applications WHERE client_id = u.id) as application_count,
              (SELECT SUM(amount) FROM invoices WHERE client_id = u.id AND status = 'paid') as total_spent,
              referrer.first_name as referrer_first_name,
              referrer.last_name as referrer_last_name
       FROM users u
       LEFT JOIN users referrer ON u.referred_by = referrer.id
       WHERE u.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    const user = result.rows[0];
    
    // Check permissions for agents
    if (req.user.role === 'agent') {
      if (user.referred_by !== req.user.id && user.id !== req.user.id) {
        throw new AppError('Access denied', 403);
      }
    }
    
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
        emailVerified: user.email_verified,
        adminApproved: user.admin_approved,
        avatarUrl: user.avatar_url,
        address: user.address,
        bio: user.bio,
        createdAt: user.created_at,
        applicationCount: parseInt(user.application_count),
        totalSpent: parseFloat(user.total_spent) || 0,
        referrer: user.referrer_first_name ? {
          firstName: user.referrer_first_name,
          lastName: user.referrer_last_name,
        } : null,
      },
    });
  })
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  idParamValidator,
  updateUserValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phone, role, adminApproved } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           admin_approved = COALESCE($5, admin_approved),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [firstName, lastName, phone, role, adminApproved, id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    const user = result.rows[0];
    
    // Send notification if agent was approved
    if (adminApproved === true) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [id, 'Account Approved', 'Congratulations! Your agent account has been approved.', 'success']
      );
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        adminApproved: user.admin_approved,
      },
    });
  })
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (id === req.user.id) {
      throw new AppError('Cannot delete your own account', 400);
    }
    
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  })
);

// @route   POST /api/users/:id/approve
// @desc    Approve agent
// @access  Private (Admin)
router.post(
  '/:id/approve',
  authenticate,
  authorize('admin'),
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE users 
       SET admin_approved = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'agent'
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Agent not found', 404);
    }
    
    // Send notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [id, 'Account Approved', 'Congratulations! Your agent account has been approved. You can now start referring clients.', 'success']
    );
    
    // Send real-time notification via socket
    try {
      notifyUser(id, {
        type: 'success',
        title: 'Account Approved',
        message: 'Congratulations! Your agent account has been approved. You can now start referring clients.',
      });
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }
    
    res.json({
      success: true,
      message: 'Agent approved successfully',
      data: {
        id: result.rows[0].id,
        adminApproved: result.rows[0].admin_approved,
      },
    });
  })
);

// @route   POST /api/users/:id/reject
// @desc    Reject agent
// @access  Private (Admin)
router.post(
  '/:id/reject',
  authenticate,
  authorize('admin'),
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET admin_approved = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'agent'
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Agent not found', 404);
    }
    
    // Send notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [id, 'Account Rejected', reason || 'Your agent account application was not approved.', 'error']
    );
    
    // Send real-time notification via socket
    try {
      notifyUser(id, {
        type: 'error',
        title: 'Account Rejected',
        message: reason || 'Your agent account application was not approved.',
      });
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }
    
    res.json({
      success: true,
      message: 'Agent rejected successfully',
    });
  })
);

// @route   GET /api/users/stats/overview
// @desc    Get user statistics
// @access  Private (Admin)
router.get(
  '/stats/overview',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'client' THEN 1 END) as total_clients,
        COUNT(CASE WHEN role = 'agent' THEN 1 END) as total_agents,
        COUNT(CASE WHEN role = 'agent' AND admin_approved = false THEN 1 END) as pending_agents,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_this_month
      FROM users
    `);
    
    const stats = statsResult.rows[0];
    
    // Get recent signups
    const recentResult = await query(`
      SELECT id, first_name, last_name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        totalUsers: parseInt(stats.total_users),
        totalClients: parseInt(stats.total_clients),
        totalAgents: parseInt(stats.total_agents),
        pendingAgents: parseInt(stats.pending_agents),
        newThisMonth: parseInt(stats.new_this_month),
        recentSignups: recentResult.rows.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        })),
      },
    });
  })
);

// @route   GET /api/users/agent/clients
// @desc    Get agent's clients
// @access  Private (Agent)
router.get(
  '/agent/clients',
  authenticate,
  authorize('agent'),
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
              COUNT(a.id) as application_count,
              COALESCE(SUM(i.amount), 0) as total_spent
       FROM users u
       LEFT JOIN applications a ON u.id = a.client_id
       LEFT JOIN invoices i ON a.id = i.application_id AND i.status = 'paid'
       WHERE u.referred_by = $1
       GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: {
        clients: result.rows.map(client => ({
          id: client.id,
          email: client.email,
          firstName: client.first_name,
          lastName: client.last_name,
          phone: client.phone,
          createdAt: client.created_at,
          applicationCount: parseInt(client.application_count),
          totalSpent: parseFloat(client.total_spent),
        })),
      },
    });
  })
);

module.exports = router;
