const express = require("express");
const router = express.Router();

const { login, register } = require("../controllers/user");
const { authLoginValidator, authRegisterValidator } = require("../validators/authValidator");

router.post("/register", authRegisterValidator, register);
router.post("/login", authLoginValidator, login);

module.exports = router;
