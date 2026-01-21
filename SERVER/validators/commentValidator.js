const { body } = require('express-validator');

const commentValidator = [
  body('content.text')
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must be at most 1000 characters'),

  body('content.mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array')
];

module.exports = { commentValidator };
