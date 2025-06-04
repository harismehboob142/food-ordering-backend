const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  country: {
    type: String,
    required: true,
    enum: ['India', 'America']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;
