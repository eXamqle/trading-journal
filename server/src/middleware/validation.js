import { body, param, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validation rules
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Trade validation rules
export const createTradeValidation = [
  body('date').notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid date'),
  body('type').notEmpty().withMessage('Type is required')
    .isIn(['profit', 'loss', 'break-even']).withMessage('Type must be profit, loss, or break-even'),
  body('symbol').trim().notEmpty().withMessage('Symbol is required')
    .isLength({ min: 1, max: 20 }).withMessage('Symbol must be between 1 and 20 characters')
    .matches(/^[A-Za-z0-9\-\/\.&\s]+$/).withMessage('Symbol contains invalid characters'),
  body('amount').notEmpty().withMessage('Amount is required')
    .isFloat().withMessage('Amount must be a valid number'),
  body('category').trim().notEmpty().withMessage('Category is required')
    .isIn(['Crypto', 'Forex', 'Futures', 'Options', 'Stocks']).withMessage('Invalid category'),
  body('fees').optional().isFloat().withMessage('Fees must be a valid number'),
  body('notes').optional().isString()
    .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Each tag must be between 1 and 50 characters'),
  validate
];

export const updateTradeValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid trade ID'),
  body('date').optional()
    .isISO8601().withMessage('Date must be a valid date'),
  body('type').optional()
    .isIn(['profit', 'loss', 'break-even']).withMessage('Type must be profit, loss, or break-even'),
  body('symbol').optional().trim()
    .isLength({ min: 1, max: 20 }).withMessage('Symbol must be between 1 and 20 characters')
    .matches(/^[A-Za-z0-9\-\/\.&\s]+$/).withMessage('Symbol contains invalid characters'),
  body('amount').optional().isFloat().withMessage('Amount must be a valid number'),
  body('category').optional()
    .isIn(['Crypto', 'Forex', 'Futures', 'Options', 'Stocks']).withMessage('Invalid category'),
  body('fees').optional().isFloat().withMessage('Fees must be a valid number'),
  body('notes').optional().isString()
    .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  validate
];

export const deleteTradeValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid trade ID'),
  validate
];

// Tag validation rules
export const createTagValidation = [
  body('name').trim().notEmpty().withMessage('Tag name is required')
    .isLength({ min: 1, max: 50 }).withMessage('Tag name must be between 1 and 50 characters'),
  body('color').notEmpty().withMessage('Color is required')
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
  validate
];

export const updateTagValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid tag ID'),
  body('name').optional().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Tag name must be between 1 and 50 characters'),
  body('color').optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
  validate
];

export const deleteTagValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid tag ID'),
  validate
];
