const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Esteetade Travels API',
      version: '1.0.0',
      description: `
# Esteetade Travels API Documentation

A comprehensive travel and visa processing platform API.

## Features
- 🔐 JWT Authentication
- 👥 Role-based Access (Client, Agent, Admin)
- 📄 Application Management
- 💳 Paystack Payment Integration
- 📧 Email Notifications
- 🔌 Real-time Updates (Socket.io)
- 📊 Analytics & Reporting

## Base URL
\`\`\`
Development: http://localhost:5000/api
Production: https://api.esteetade.com
\`\`\`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## User Roles
- **client**: Can create applications, make payments, view own data
- **agent**: Can submit applications for clients, view referred clients
- **admin**: Full access to all features and data
      `,
      contact: {
        name: 'Esteetade Support',
        email: 'support@esteetade.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.esteetade.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['client', 'agent', 'admin'] },
            referralCode: { type: 'string' },
            emailVerified: { type: 'boolean' },
            adminApproved: { type: 'boolean' },
            avatarUrl: { type: 'string' },
            address: { type: 'string' },
            bio: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            clientId: { type: 'string', format: 'uuid' },
            agentId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['cv', 'study', 'work', 'flight', 'hotel', 'document'] },
            typeLabel: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string', enum: ['NGN', 'USD'] },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed'] },
            progress: { type: 'integer', minimum: 0, maximum: 100 },
            documents: { type: 'array', items: { type: 'string' } },
            formData: { type: 'object' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            applicationId: { type: 'string', format: 'uuid' },
            clientId: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string', enum: ['paid', 'unpaid', 'refunded', 'cancelled'] },
            paymentMethod: { type: 'string' },
            paymentReference: { type: 'string' },
            paidAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
            read: { type: 'boolean' },
            link: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Access denied. No token provided.',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'User does not have required permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Access denied. Insufficient permissions.',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  { field: 'email', message: 'Please provide a valid email address' },
                ],
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and profile management' },
      { name: 'Applications', description: 'Application submission and management' },
      { name: 'Users', description: 'User management (Admin/Agent)' },
      { name: 'Invoices', description: 'Invoice and payment management' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Uploads', description: 'File upload management' },
      { name: 'Payments', description: 'Paystack payment integration' },
      { name: 'Bulk Operations', description: 'Bulk actions for admin efficiency' },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to route files
};

const specs = swaggerJsdoc(options);

const swaggerDocs = (app) => {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Esteetade Travels API',
  }));

  // JSON spec endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger docs available at: /api/docs');
};

module.exports = swaggerDocs;
