const { body } = require("express-validator");

const authLoginValidator = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password should have a minimum of 8 characters")
    .trim(),
];

const authRegisterValidator = [
  body("displayName")
    .notEmpty()
    .withMessage("Display name is required")
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage("Display name must be between 2 and 40 characters"),

  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password should have a minimum of 8 characters")
    .trim(),
];

module.exports = { authLoginValidator, authRegisterValidator };
