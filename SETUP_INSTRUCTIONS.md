# Backend Setup - Add Export Routes

To complete the production readiness, add these changes to `backend/src/index.js`:

## 1. Add the export routes import (after line with bulkRoutes):

```javascript
const exportRoutes = require('./routes/exports');
```

## 2. Add the export route registration (after app.use('/api/bulk', bulkRoutes)):

```javascript
app.use('/api', exportRoutes);
```

## Changes Complete:

### Frontend (app/src/services/api.ts)
- Added export methods for applications, users, and invoices
- Added download methods for invoices and files

### Backend (backend/src/routes/exports.js)
- Created new export routes file with CSV export functionality
- GET /api/applications/export - Export applications to CSV
- GET /api/users/export - Export users to CSV  
- GET /api/invoices/export - Export invoices to CSV

### Already Completed (from TODO):
- Missing route imports (payments.js, bulk.js)
- Security middleware (helmet, rate limiting, mongo sanitize)
- Docker configuration
- Environment variables
- Error handling improvements
