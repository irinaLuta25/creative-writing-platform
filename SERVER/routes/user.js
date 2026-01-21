
const express = require('express');
const router = express.Router();

const { login, register } = require('../controllers/user')
const { authValidator } = require('../validators/authValidator')

router.post('/register', authValidator, register);
router.post('/login', authValidator, login);

module.exports = router;
