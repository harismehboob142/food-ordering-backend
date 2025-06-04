// Seed script for creating initial data in the database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load models
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Clear existing data
const clearData = async () => {
  try {
    await Order.deleteMany({});
    await FoodItem.deleteMany({});
    await Restaurant.deleteMany({});
    await User.deleteMany({});
    console.log('All existing data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const users = [
      {
        username: 'nickfury',
        password: 'password123',
        role: 'admin'
      },
      {
        username: 'captainmarvel',
        password: 'password123',
        role: 'manager',
        country: 'India'
      },
      {
        username: 'captainamerica',
        password: 'password123',
        role: 'manager',
        country: 'America'
      },
      {
        username: 'thanos',
        password: 'password123',
        role: 'member',
        country: 'India'
      },
      {
        username: 'thor',
        password: 'password123',
        role: 'member',
        country: 'India'
      },
      {
        username: 'travis',
        password: 'password123',
        role: 'member',
        country: 'America'
      }
    ];

    // Hash passwords before saving
    for (let user of users) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

// Seed restaurants
const seedRestaurants = async () => {
  try {
    const restaurants = [
      {
        name: 'Taj Mahal Restaurant',
        address: 'Mumbai, India',
        country: 'India'
      },
      {
        name: 'Delhi Delights',
        address: 'Delhi, India',
        country: 'India'
      },
      {
        name: 'American Diner',
        address: 'New York, USA',
        country: 'America'
      },
      {
        name: 'Burger Palace',
        address: 'Los Angeles, USA',
        country: 'America'
      }
    ];

    const createdRestaurants = await Restaurant.insertMany(restaurants);
    console.log(`${createdRestaurants.length} restaurants created`);
    return createdRestaurants;
  } catch (error) {
    console.error('Error seeding restaurants:', error);
    process.exit(1);
  }
};

// Seed food items
const seedFoodItems = async (restaurants) => {
  try {
    const foodItems = [
      // Indian Restaurant 1
      {
        name: 'Butter Chicken',
        description: 'Creamy tomato sauce with tender chicken pieces',
        price: 12.99,
        restaurant: restaurants[0]._id,
        country: 'India'
      },
      {
        name: 'Naan Bread',
        description: 'Soft flatbread baked in tandoor oven',
        price: 3.99,
        restaurant: restaurants[0]._id,
        country: 'India'
      },
      // Indian Restaurant 2
      {
        name: 'Vegetable Biryani',
        description: 'Fragrant rice dish with mixed vegetables',
        price: 10.99,
        restaurant: restaurants[1]._id,
        country: 'India'
      },
      {
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese with spices',
        price: 9.99,
        restaurant: restaurants[1]._id,
        country: 'India'
      },
      // American Restaurant 1
      {
        name: 'Classic Cheeseburger',
        description: 'Beef patty with cheese, lettuce, and tomato',
        price: 8.99,
        restaurant: restaurants[2]._id,
        country: 'America'
      },
      {
        name: 'French Fries',
        description: 'Crispy golden fries with sea salt',
        price: 4.99,
        restaurant: restaurants[2]._id,
        country: 'America'
      },
      // American Restaurant 2
      {
        name: 'BBQ Ribs',
        description: 'Slow-cooked ribs with barbecue sauce',
        price: 15.99,
        restaurant: restaurants[3]._id,
        country: 'America'
      },
      {
        name: 'Mac and Cheese',
        description: 'Creamy macaroni with cheese sauce',
        price: 7.99,
        restaurant: restaurants[3]._id,
        country: 'America'
      }
    ];

    const createdFoodItems = await FoodItem.insertMany(foodItems);
    
    // Update restaurant menus with food items
    for (let i = 0; i < restaurants.length; i++) {
      const restaurantFoodItems = createdFoodItems.filter(
        item => item.restaurant.toString() === restaurants[i]._id.toString()
      );
      
      await Restaurant.findByIdAndUpdate(
        restaurants[i]._id,
        { menu: restaurantFoodItems.map(item => item._id) }
      );
    }
    
    console.log(`${createdFoodItems.length} food items created`);
    return createdFoodItems;
  } catch (error) {
    console.error('Error seeding food items:', error);
    process.exit(1);
  }
};

// Seed orders
const seedOrders = async (users, foodItems) => {
  try {
    // Find manager users
    const indiaManager = users.find(user => user.role === 'manager' && user.country === 'India');
    const americaManager = users.find(user => user.role === 'manager' && user.country === 'America');
    
    // Find food items by country
    const indiaFoodItems = foodItems.filter(item => item.country === 'India');
    const americaFoodItems = foodItems.filter(item => item.country === 'America');
    
    const orders = [
      // India order
      {
        user: indiaManager._id,
        items: [
          { foodItem: indiaFoodItems[0]._id, quantity: 2 },
          { foodItem: indiaFoodItems[1]._id, quantity: 3 }
        ],
        totalAmount: (indiaFoodItems[0].price * 2) + (indiaFoodItems[1].price * 3),
        status: 'pending_payment',
        paymentMethod: 'credit_card',
        country: 'India'
      },
      // America order
      {
        user: americaManager._id,
        items: [
          { foodItem: americaFoodItems[0]._id, quantity: 1 },
          { foodItem: americaFoodItems[1]._id, quantity: 2 }
        ],
        totalAmount: (americaFoodItems[0].price * 1) + (americaFoodItems[1].price * 2),
        status: 'paid',
        paymentMethod: 'paypal',
        country: 'America'
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`${createdOrders.length} orders created`);
  } catch (error) {
    console.error('Error seeding orders:', error);
    process.exit(1);
  }
};

// Run the seeding
const seedDB = async () => {
  try {
    await clearData();
    const users = await seedUsers();
    const restaurants = await seedRestaurants();
    const foodItems = await seedFoodItems(restaurants);
    await seedOrders(users, foodItems);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
