const { body } = require('express-validator');

const challengeValidator = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('prompt.text')
    .notEmpty()
    .withMessage('Prompt text is required'),

  body('prompt.constraints.maxWords')
    .isInt({ min: 50, max: 2000 })
    .withMessage('maxWords must be between 50 and 2000'),

  body('prompt.constraints.language')
    .notEmpty()
    .withMessage('Language is required'),

  body('prompt.tags')
    .isArray()
    .withMessage('Prompt tags must be an array')
];

module.exports = { challengeValidator };
