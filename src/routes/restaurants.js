const express = require('express');
const { verifyToken, checkRole, checkCountryAccess } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/restaurants
// @desc    Get all restaurants (filtered by country for non-admin roles)
// @access  Private - All roles
router.get('/', [verifyToken, checkCountryAccess], async (req, res) => {
  try {
    // For admin, get all restaurants
    // For manager and member, get only restaurants from their country
    const filter = req.user.role === 'admin' ? {} : { country: req.user.country };
    
    const restaurants = await Restaurant.find(filter);
    res.json(restaurants);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/restaurants/:id
// @desc    Get restaurant by ID (with country check)
// @access  Private - All roles
router.get('/:id', [verifyToken, checkCountryAccess], async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Check if user has access to this restaurant based on country
    if (req.user.role !== 'admin' && restaurant.country !== req.user.country) {
      return res.status(403).json({ message: 'Access denied: Country restriction' });
    }
    
    res.json(restaurant);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/restaurants
// @desc    Create a new restaurant
// @access  Private - Admin only
router.post(
  '/',
  [
    verifyToken,
    checkRole(['admin']),
    [
      check('name', 'Name is required').notEmpty(),
      check('address', 'Address is required').notEmpty(),
      check('country', 'Country must be either India or America').isIn(['India', 'America'])
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, country } = req.body;

    try {
      // Create new restaurant
      const restaurant = new Restaurant({
        name,
        address,
        country
      });

      await restaurant.save();
      res.status(201).json(restaurant);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/restaurants/:id
// @desc    Update a restaurant
// @access  Private - Admin only
router.put(
  '/:id',
  [
    verifyToken,
    checkRole(['admin']),
    [
      check('name', 'Name is required').optional().notEmpty(),
      check('address', 'Address is required').optional().notEmpty(),
      check('country', 'Country must be either India or America').optional().isIn(['India', 'America'])
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      // Update restaurant fields
      const { name, address, country } = req.body;
      if (name) restaurant.name = name;
      if (address) restaurant.address = address;
      if (country) restaurant.country = country;

      await restaurant.save();
      res.json(restaurant);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE /api/restaurants/:id
// @desc    Delete a restaurant
// @access  Private - Admin only
router.delete('/:id', [verifyToken, checkRole(['admin'])], async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    await restaurant.deleteOne();
    res.json({ message: 'Restaurant removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
