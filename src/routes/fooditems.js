const express = require('express');
const { verifyToken, checkRole, checkCountryAccess } = require('../middleware/auth');
const FoodItem = require('../models/FoodItem');
const Restaurant = require('../models/Restaurant');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/fooditems
// @desc    Get all food items (filtered by country for non-admin roles)
// @access  Private - All roles
router.get('/', [verifyToken, checkCountryAccess], async (req, res) => {
  try {
    // For admin, get all food items
    // For manager and member, get only food items from their country
    const filter = req.user.role === 'admin' ? {} : { country: req.user.country };
    
    const foodItems = await FoodItem.find(filter).populate('restaurant', 'name country');
    res.json(foodItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/fooditems/:id
// @desc    Get food item by ID (with country check)
// @access  Private - All roles
router.get('/:id', [verifyToken, checkCountryAccess], async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate('restaurant', 'name country');
    
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    // Check if user has access to this food item based on country
    if (req.user.role !== 'admin' && foodItem.country !== req.user.country) {
      return res.status(403).json({ message: 'Access denied: Country restriction' });
    }
    
    res.json(foodItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/fooditems
// @desc    Create a new food item
// @access  Private - Admin, Manager, Team Member
router.post(
  '/',
  [
    verifyToken,
    checkRole(['admin', 'manager', 'member']),
    checkCountryAccess,
    [
      check('name', 'Name is required').notEmpty(),
      check('price', 'Price is required and must be a positive number').isFloat({ min: 0 }),
      check('restaurant', 'Restaurant ID is required').notEmpty(),
      check('description', 'Description is required').notEmpty()
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, restaurant } = req.body;

    try {
      // Check if restaurant exists
      const restaurantDoc = await Restaurant.findById(restaurant);
      if (!restaurantDoc) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Check if user has access to this restaurant based on country
      if (req.user.role !== 'admin' && restaurantDoc.country !== req.user.country) {
        return res.status(403).json({ message: 'Access denied: Cannot add food items to restaurants from different country' });
      }

      // Create new food item
      const foodItem = new FoodItem({
        name,
        description,
        price,
        restaurant,
        country: restaurantDoc.country // Inherit country from restaurant
      });

      await foodItem.save();
      
      // Add food item to restaurant's menu
      restaurantDoc.menu.push(foodItem._id);
      await restaurantDoc.save();
      
      res.status(201).json(foodItem);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/fooditems/:id
// @desc    Update a food item
// @access  Private - Admin, Manager, Team Member (with country check)
router.put(
  '/:id',
  [
    verifyToken,
    checkRole(['admin', 'manager', 'member']),
    checkCountryAccess,
    [
      check('name', 'Name is required').optional().notEmpty(),
      check('price', 'Price must be a positive number').optional().isFloat({ min: 0 }),
      check('description', 'Description is required').optional().notEmpty()
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let foodItem = await FoodItem.findById(req.params.id);
      if (!foodItem) {
        return res.status(404).json({ message: 'Food item not found' });
      }
      
      // Check if user has access to this food item based on country
      if (req.user.role !== 'admin' && foodItem.country !== req.user.country) {
        return res.status(403).json({ message: 'Access denied: Country restriction' });
      }

      // Update food item fields
      const { name, description, price } = req.body;
      if (name) foodItem.name = name;
      if (description) foodItem.description = description;
      if (price) foodItem.price = price;

      await foodItem.save();
      res.json(foodItem);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Food item not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE /api/fooditems/:id
// @desc    Delete a food item
// @access  Private - Admin, Manager, Team Member (with country check)
router.delete('/:id', [verifyToken, checkRole(['admin', 'manager', 'member']), checkCountryAccess], async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    // Check if user has access to this food item based on country
    if (req.user.role !== 'admin' && foodItem.country !== req.user.country) {
      return res.status(403).json({ message: 'Access denied: Country restriction' });
    }
    
    // Remove food item from restaurant's menu
    await Restaurant.findByIdAndUpdate(
      foodItem.restaurant,
      { $pull: { menu: foodItem._id } }
    );
    
    await foodItem.deleteOne();
    res.json({ message: 'Food item removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
