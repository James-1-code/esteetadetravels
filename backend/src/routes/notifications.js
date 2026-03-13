const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { idParamValidator } = require('../middleware/validator');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { limit = 20, unreadOnly = false } = req.query;
    
    let sql = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    
    const params = [req.user.id];
    
    if (unreadOnly === 'true') {
      sql += ' AND read = false';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $2';
    params.push(limit);
    
    const result = await query(sql, params);
    
    // Get unread count
    const countResult = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: {
        notifications: result.rows.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          link: n.link,
          createdAt: n.created_at,
        })),
        unreadCount: parseInt(countResult.rows[0].count),
      },
    });
  })
);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put(
  '/:id/read',
  authenticate,
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE notifications 
       SET read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  })
);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put(
  '/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    await query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  })
);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete(
  '/:id',
  authenticate,
  idParamValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }
    
    res.json({
      success: true,
      message: 'Notification deleted',
    });
  })
);

module.exports = router;
