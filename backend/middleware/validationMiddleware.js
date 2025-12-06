const { body, param, query, validationResult } = require('express-validator');

// Common validation rules
const commonValidators = {
  email: body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  password: body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  name: body('name').trim().notEmpty().withMessage('Name is required'),
  phone: body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  url: body('url').optional().isURL().withMessage('Valid URL is required'),
  integer: (field) => body(field).optional().isInt().withMessage('Must be an integer'),
  float: (field) => body(field).optional().isFloat().withMessage('Must be a number'),
  date: (field) => body(field).optional().isISO8601().withMessage('Valid date is required'),
  json: (field) => body(field).optional().custom(value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      throw new Error('Invalid JSON format');
    }
  })
};

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Specific validation chains
const authValidation = {
  register: [
    commonValidators.name,
    commonValidators.email,
    commonValidators.password,
    body('role').optional().isIn(['admin', 'editor']).withMessage('Invalid role'),
    validate
  ],
  
  login: [
    commonValidators.email,
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ]
};

const contactValidation = {
  submitMessage: [
    commonValidators.name,
    commonValidators.email,
    body('message').trim().notEmpty().withMessage('Message is required'),
    commonValidators.phone,
    body('subject').optional().trim(),
    validate
  ]
};

const serviceValidation = {
  create: [
    body('service_name').trim().notEmpty().withMessage('Service name is required'),
    body('short_description').trim().notEmpty().withMessage('Short description is required'),
    body('long_description').trim().notEmpty().withMessage('Long description is required'),
    commonValidators.float('price_start_from'),
    commonValidators.integer('display_order'),
    commonValidators.json('feature_list'),
    validate
  ]
};

const portfolioValidation = {
  create: [
    body('project_name').trim().notEmpty().withMessage('Project name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('project_type').trim().notEmpty().withMessage('Project type is required'),
    commonValidators.json('tech_stack'),
    commonValidators.json('images'),
    commonValidators.date('completion_date'),
    validate
  ]
};

const testimonialValidation = {
  create: [
    commonValidators.name,
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('position_company').optional().trim(),
    validate
  ]
};

module.exports = {
  validate,
  commonValidators,
  authValidation,
  contactValidation,
  serviceValidation,
  portfolioValidation,
  testimonialValidation
};