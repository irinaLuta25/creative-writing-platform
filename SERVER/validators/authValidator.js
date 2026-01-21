const { body } = require('express-validator');

const authValidator = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password should have a minimum of 8 characters')
    .trim()
];

module.exports = { authValidator };
