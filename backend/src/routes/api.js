const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    routes: ['/health', '/auth', '/applications', '/users', '/invoices']
  });
});

module.exports = router;

