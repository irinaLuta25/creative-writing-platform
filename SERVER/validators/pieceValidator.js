const { body } = require('express-validator');

const pieceValidator = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters'),

  body('content.body')
    .notEmpty()
    .withMessage('Content body is required'),

  body('content.language')
    .notEmpty()
    .withMessage('Language is required'),

  body('classification.tags')
    .isArray({ min: 1 })
    .withMessage('At least one tag is required')
    .custom((tags) => {
      if (tags.length > 5) {
        throw new Error('Maximum 5 tags allowed');
      }
      return true;
    }),

  body('classification.genre.id')
    .notEmpty()
    .withMessage('Genre id is required'),

  body('classification.genre.name')
    .notEmpty()
    .withMessage('Genre name is required')
];

module.exports = { pieceValidator };
