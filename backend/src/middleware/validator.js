const { body, param, query, validationResult } = require('express-validator');

// Helper to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name is required'),
  body('role')
    .isIn(['client', 'agent'])
    .withMessage('Role must be either client or agent'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  validate,
];

const loginValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

// Application validators
const createApplicationValidator = [
  body('applicationType')
    .isIn(['cv', 'study', 'work', 'flight', 'hotel', 'document'])
    .withMessage('Invalid application type'),
  body('typeLabel')
    .trim()
    .notEmpty()
    .withMessage('Type label is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .isIn(['NGN', 'USD'])
    .withMessage('Currency must be NGN or USD'),
  body('formData')
    .optional()
    .isObject()
    .withMessage('Form data must be an object'),
  validate,
];

const updateApplicationValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid application ID'),
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed'])
    .withMessage('Invalid status'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('notes')
    .optional()
    .trim(),
  validate,
];

// User validators
const updateUserValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .trim(),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  validate,
];

// Query validators
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim(),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'active', 'inactive']),
  validate,
];

// ID param validator
const idParamValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  createApplicationValidator,
  updateApplicationValidator,
  updateUserValidator,
  paginationValidator,
  idParamValidator,
};
