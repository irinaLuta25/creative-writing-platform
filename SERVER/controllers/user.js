const { validationResult } = require('express-validator');
const { findByEmail, checkEmailExists, create } = require('../models/user');
const { generateToken, hashPassword, comparePassword } = require('../auth');
const admin = require('firebase-admin');
const { FieldValue } = admin.firestore;

const login = async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    const isValid = await comparePassword(
      password,
      user.auth.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    const token = generateToken({
      userId: user.userId,
      email: user.auth.email,
      roles: user.roles
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.userId,
        email: user.auth.email,
        profile: user.profile,
        roles: user.roles
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};


const register = async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  try {
    const { email, password,displayName } = req.body;

    const exists = await checkEmailExists(email);
    if (exists) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const newUser = {
      auth: {
        email,
        passwordHash
      },
      profile: {
        displayName: displayName.trim(),
        username: email.split('@')[0],
        bio: ''
      },
      roles: ['user'],
      stats: {
        piecesCount: 0,
        commentsCount: 0
      },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }
    };

    const userId = await create(newUser);

    const token = generateToken({
      userId,
      email,
      roles: ['user']
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        profile: newUser.profile,
        roles: ['user']
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

module.exports = { login, register };
