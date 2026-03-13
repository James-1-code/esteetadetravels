const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { sendBulkEmails } = require('../services/email');

// @route   POST /api/bulk/users/status
// @desc    Bulk update user status
// @access  Private (Admin)
router.post(
  '/users/status',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { userIds, action, reason } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError('User IDs array is required', 400);
    }

    if (!['activate', 'deactivate', 'approve', 'reject'].includes(action)) {
      throw new AppError('Invalid action', 400);
    }

    const client = await query.pool.connect();
    const results = [];

    try {
      await client.query('BEGIN');

      for (const userId of userIds) {
        let updateResult;

        switch (action) {
          case 'activate':
            updateResult = await client.query(
              'UPDATE users SET admin_approved = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, first_name',
              [userId]
            );
            break;
          case 'deactivate':
            updateResult = await client.query(
              'UPDATE users SET admin_approved = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, first_name',
              [userId]
            );
            break;
          case 'approve':
            updateResult = await client.query(
              "UPDATE users SET admin_approved = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND role = 'agent' RETURNING id, email, first_name",
              [userId]
            );
            // Send approval email
            if (updateResult.rows.length > 0) {
              await sendEmail(updateResult.rows[0].email, 'agentApproved', {
                firstName: updateResult.rows[0].first_name,
                referralCode: `EST-AGT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
              });
            }
            break;
          case 'reject':
            updateResult = await client.query(
              "UPDATE users SET admin_approved = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND role = 'agent' RETURNING id, email, first_name",
              [userId]
            );
            break;
        }

        if (updateResult.rows.length > 0) {
          results.push({
            userId,
            success: true,
            email: updateResult.rows[0].email,
          });
        } else {
          results.push({
            userId,
            success: false,
            error: 'User not found or not applicable',
          });
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Bulk ${action} completed`,
        data: {
          processed: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
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

// @route   POST /api/bulk/users/delete
// @desc    Bulk delete users
// @access  Private (Admin)
router.post(
  '/users/delete',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError('User IDs array is required', 400);
    }

    // Prevent deleting self
    if (userIds.includes(req.user.id)) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const result = await query(
      'DELETE FROM users WHERE id = ANY($1) RETURNING id',
      [userIds]
    );

    res.json({
      success: true,
      message: 'Users deleted successfully',
      data: {
        deleted: result.rows.length,
        ids: result.rows.map((r) => r.id),
      },
    });
  })
);

// @route   POST /api/bulk/users/email
// @desc    Bulk send emails to users
// @access  Private (Admin)
router.post(
  '/users/email',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { userIds, subject, message, template } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError('User IDs array is required', 400);
    }

    // Get user emails
    const usersResult = await query(
      'SELECT id, email, first_name FROM users WHERE id = ANY($1)',
      [userIds]
    );

    const users = usersResult.rows;

    if (users.length === 0) {
      throw new AppError('No users found', 404);
    }

    // Send emails
    const emailResults = await sendBulkEmails(
      users,
      template || 'welcome',
      (user) => ({
        firstName: user.first_name,
        email: user.email,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      })
    );

    res.json({
      success: true,
      message: 'Bulk emails sent',
      data: {
        sent: emailResults.filter((r) => r.success).length,
        failed: emailResults.filter((r) => !r.success).length,
        results: emailResults,
      },
    });
  })
);

// @route   POST /api/bulk/applications/status
// @desc    Bulk update application status
// @access  Private (Admin, Agent)
router.post(
  '/applications/status',
  authenticate,
  authorize('admin', 'agent'),
  asyncHandler(async (req, res) => {
    const { applicationIds, status, progress, notes } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new AppError('Application IDs array is required', 400);
    }

    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const client = await query.pool.connect();
    const results = [];

    try {
      await client.query('BEGIN');

      for (const appId of applicationIds) {
        // Check permissions for agents
        if (req.user.role === 'agent') {
          const appCheck = await client.query(
            'SELECT client_id FROM applications WHERE id = $1',
            [appId]
          );

          if (appCheck.rows.length > 0) {
            const clientResult = await client.query(
              'SELECT referred_by FROM users WHERE id = $1',
              [appCheck.rows[0].client_id]
            );

            if (
              appCheck.rows[0].agent_id !== req.user.id &&
              clientResult.rows[0]?.referred_by !== req.user.id
            ) {
              results.push({
                applicationId: appId,
                success: false,
                error: 'Access denied',
              });
              continue;
            }
          }
        }

        const updateResult = await client.query(
          `UPDATE applications 
           SET status = $1,
               progress = COALESCE($2, progress),
               notes = COALESCE($3, notes),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING id, client_id`,
          [status, progress, notes, appId]
        );

        if (updateResult.rows.length > 0) {
          // Create notification for client
          await client.query(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES ($1, $2, $3, $4)`,
            [
              updateResult.rows[0].client_id,
              'Application Update',
              `Your application status has been updated to ${status}.`,
              status === 'approved' || status === 'completed' ? 'success' : status === 'rejected' ? 'error' : 'info',
            ]
          );

          results.push({
            applicationId: appId,
            success: true,
          });
        } else {
          results.push({
            applicationId: appId,
            success: false,
            error: 'Application not found',
          });
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Bulk status update completed',
        data: {
          processed: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
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

// @route   POST /api/bulk/applications/delete
// @desc    Bulk delete applications
// @access  Private (Admin)
router.post(
  '/applications/delete',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { applicationIds } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new AppError('Application IDs array is required', 400);
    }

    const result = await query(
      'DELETE FROM applications WHERE id = ANY($1) RETURNING id',
      [applicationIds]
    );

    res.json({
      success: true,
      message: 'Applications deleted successfully',
      data: {
        deleted: result.rows.length,
        ids: result.rows.map((r) => r.id),
      },
    });
  })
);

// @route   POST /api/bulk/invoices/status
// @desc    Bulk update invoice status
// @access  Private (Admin)
router.post(
  '/invoices/status',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { invoiceIds, status } = req.body;

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      throw new AppError('Invoice IDs array is required', 400);
    }

    if (!['paid', 'unpaid', 'refunded', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const result = await query(
      `UPDATE invoices 
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($2)
       RETURNING id`,
      [status, invoiceIds]
    );

    res.json({
      success: true,
      message: 'Bulk invoice update completed',
      data: {
        updated: result.rows.length,
        ids: result.rows.map((r) => r.id),
      },
    });
  })
);

// @route   POST /api/bulk/notifications/delete
// @desc    Bulk delete notifications
// @access  Private
router.post(
  '/notifications/delete',
  authenticate,
  asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new AppError('Notification IDs array is required', 400);
    }

    const result = await query(
      'DELETE FROM notifications WHERE id = ANY($1) AND user_id = $2 RETURNING id',
      [notificationIds, req.user.id]
    );

    res.json({
      success: true,
      message: 'Notifications deleted',
      data: {
        deleted: result.rows.length,
        ids: result.rows.map((r) => r.id),
      },
    });
  })
);

// @route   POST /api/bulk/notifications/mark-read
// @desc    Bulk mark notifications as read
// @access  Private
router.post(
  '/notifications/mark-read',
  authenticate,
  asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new AppError('Notification IDs array is required', 400);
    }

    const result = await query(
      'UPDATE notifications SET read = true WHERE id = ANY($1) AND user_id = $2 RETURNING id',
      [notificationIds, req.user.id]
    );

    res.json({
      success: true,
      message: 'Notifications marked as read',
      data: {
        updated: result.rows.length,
        ids: result.rows.map((r) => r.id),
      },
    });
  })
);

module.exports = router;
