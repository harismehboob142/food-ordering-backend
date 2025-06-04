const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    enum: ['India', 'America']
  },
  menu: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
