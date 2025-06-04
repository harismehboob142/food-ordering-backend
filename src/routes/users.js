const express = require('express');
const { verifyToken, checkRole, checkCountryAccess } = require('../middleware/auth');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private - Admin only
router.get('/', [verifyToken, checkRole(['admin'])], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private - Admin only
router.post(
  '/',
  [
    verifyToken,
    checkRole(['admin']),
    [
      check('username', 'Username is required').notEmpty(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('role', 'Role is required').isIn(['admin', 'manager', 'member']),
      check('country', 'Country is required for non-admin roles').custom((value, { req }) => {
        if (req.body.role !== 'admin' && !['India', 'America'].includes(value)) {
          throw new Error('Country must be either India or America for non-admin roles');
        }
        return true;
      })
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role, country } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ username });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      user = new User({
        username,
        password,
        role,
        country: role === 'admin' ? undefined : country
      });

      await user.save();

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        country: user.country
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private - Admin only
router.put(
  '/:id',
  [
    verifyToken,
    checkRole(['admin']),
    [
      check('username', 'Username is required').optional().notEmpty(),
      check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 }),
      check('role', 'Role is required').optional().isIn(['admin', 'manager', 'member']),
      check('country', 'Country is required for non-admin roles').optional().custom((value, { req }) => {
        if (req.body.role && req.body.role !== 'admin' && !['India', 'America'].includes(value)) {
          throw new Error('Country must be either India or America for non-admin roles');
        }
        return true;
      })
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user fields
      const { username, password, role, country } = req.body;
      if (username) user.username = username;
      if (password) user.password = password;
      if (role) {
        user.role = role;
        // If role is changed to admin, remove country
        if (role === 'admin') {
          user.country = undefined;
        }
        // If role is changed from admin to non-admin, country is required
        else if (user.role === 'admin' && !country) {
          return res.status(400).json({ message: 'Country is required for non-admin roles' });
        }
      }
      if (country && user.role !== 'admin') user.country = country;

      await user.save();

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        country: user.country
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private - Admin only
router.delete('/:id', [verifyToken, checkRole(['admin'])], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
