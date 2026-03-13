# Esteetade Travels Backend API

A production-ready Node.js/Express backend for the Esteetade Travels platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with proper schema design
- **File Uploads**: Multer for document uploads with validation
- **API Validation**: Express-validator for request validation
- **Error Handling**: Centralized error handling middleware
- **Security**: CORS, password hashing with bcrypt
- **Notifications**: In-app notification system

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth, validation, error handling
│   ├── routes/         # API routes
│   └── index.js        # Server entry point
├── migrations/         # Database migrations and seeding
├── uploads/           # Uploaded files storage
├── .env.example       # Environment variables template
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL Database

Make sure you have PostgreSQL installed and running. Create a database:

```bash
createdb esteetade
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Database (Optional)

```bash
npm run seed
```

### 6. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/me` | Update profile | Private |
| POST | `/api/auth/change-password` | Change password | Private |

### Application Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/applications` | List applications | Private |
| GET | `/api/applications/:id` | Get single application | Private |
| POST | `/api/applications` | Create application | Client/Agent |
| PUT | `/api/applications/:id` | Update application | Admin/Agent |
| DELETE | `/api/applications/:id` | Delete application | Admin |
| GET | `/api/applications/stats/overview` | Get statistics | Private |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | List users | Admin/Agent |
| GET | `/api/users/:id` | Get single user | Admin/Agent |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| POST | `/api/users/:id/approve` | Approve agent | Admin |
| POST | `/api/users/:id/reject` | Reject agent | Admin |
| GET | `/api/users/stats/overview` | User statistics | Admin |
| GET | `/api/users/agent/clients` | Agent's clients | Agent |

### Invoice Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/invoices` | List invoices | Private |
| GET | `/api/invoices/:id` | Get single invoice | Private |
| POST | `/api/invoices/:id/pay` | Process payment | Client |
| GET | `/api/invoices/stats/overview` | Invoice statistics | Private |
| POST | `/api/invoices/:id/refund` | Refund invoice | Admin |

### Notification Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/notifications` | List notifications | Private |
| PUT | `/api/notifications/:id/read` | Mark as read | Private |
| PUT | `/api/notifications/read-all` | Mark all read | Private |
| DELETE | `/api/notifications/:id` | Delete notification | Private |

### Upload Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/uploads` | Upload files | Private |
| GET | `/api/uploads/:userId/:filename` | Get file | Private |
| DELETE | `/api/uploads/:id` | Delete file | Private |
| GET | `/api/uploads/my-files` | List my files | Private |

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

- **client**: Can create applications, view own data, make payments
- **agent**: Can submit applications for clients, view referred clients
- **admin**: Full access to all features and data

## 🧪 Test Accounts

After running `npm run seed`, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@esteetade.com | admin123 | Admin |
| agent@esteetade.com | agent123 | Agent (Approved) |
| pending@esteetade.com | agent123 | Agent (Pending) |
| client1@example.com | client123 | Client |
| client2@example.com | client123 | Client |

## 📦 Database Schema

### Users Table
- id (UUID, PK)
- email (Unique)
- password (Hashed)
- first_name, last_name
- role (client/agent/admin)
- referral_code (Unique, for agents)
- referred_by (FK to users)
- email_verified, admin_approved
- timestamps

### Applications Table
- id (UUID, PK)
- client_id, agent_id (FK to users)
- application_type, type_label
- amount, currency
- status, progress
- documents, form_data
- timestamps

### Invoices Table
- id (UUID, PK)
- application_id, client_id (FK)
- invoice_number (Unique)
- amount, currency, status
- payment_method, payment_reference
- paid_at, timestamps

### Notifications Table
- id (UUID, PK)
- user_id (FK)
- title, message, type
- read, link
- created_at

### Documents Table
- id (UUID, PK)
- application_id, user_id (FK)
- filename, original_name
- mime_type, size, path
- uploaded_at

## 🚀 Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start src/index.js --name esteetade-api
```

### Using Docker

```bash
docker build -t esteetade-api .
docker run -p 5000:5000 --env-file .env esteetade-api
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
DB_HOST=your-db-host
DB_SSL=true
JWT_SECRET=your-very-secure-random-secret
```

## 📄 License

MIT License - Esteetade Travels
