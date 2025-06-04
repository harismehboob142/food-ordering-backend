// Test script for the Food Ordering System API
// This script tests the backend API endpoints for different user roles and country-based access

const axios = require('axios');
const assert = require('assert');

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Test user credentials
const users = {
  admin: {
    username: 'nickfury',
    password: 'password123'
  },
  indiaManager: {
    username: 'captainmarvel',
    password: 'password123'
  },
  americaManager: {
    username: 'captainamerica',
    password: 'password123'
  },
  indiaMember: {
    username: 'thanos',
    password: 'password123'
  },
  americaMember: {
    username: 'travis',
    password: 'password123'
  }
};

// Store tokens for each user
const tokens = {};

// Helper function to login and get token
async function login(userType) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, users[userType]);
    tokens[userType] = response.data.token;
    console.log(`✅ ${userType} login successful`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${userType} login failed:`, error.response?.data || error.message);
    throw error;
  }
}

// Test restaurant access for different roles
async function testRestaurantAccess() {
  console.log('\n--- Testing Restaurant Access ---');
  
  // Admin should see all restaurants
  try {
    const response = await axios.get(`${API_URL}/restaurants`, {
      headers: { 'x-auth-token': tokens.admin }
    });
    console.log(`✅ Admin can see ${response.data.length} restaurants`);
    
    // Check if admin can see restaurants from both countries
    const indiaRestaurants = response.data.filter(r => r.country === 'India');
    const americaRestaurants = response.data.filter(r => r.country === 'America');
    
    console.log(`  - Admin sees ${indiaRestaurants.length} India restaurants`);
    console.log(`  - Admin sees ${americaRestaurants.length} America restaurants`);
    
    assert(indiaRestaurants.length > 0 && americaRestaurants.length > 0, 
      'Admin should see restaurants from both countries');
  } catch (error) {
    console.error('❌ Admin restaurant access test failed:', error.response?.data || error.message);
  }
  
  // India Manager should only see India restaurants
  try {
    const response = await axios.get(`${API_URL}/restaurants`, {
      headers: { 'x-auth-token': tokens.indiaManager }
    });
    console.log(`✅ India Manager can see ${response.data.length} restaurants`);
    
    // All restaurants should be from India
    const nonIndiaRestaurants = response.data.filter(r => r.country !== 'India');
    assert(nonIndiaRestaurants.length === 0, 'India Manager should only see India restaurants');
    console.log('  - All restaurants are from India ✓');
  } catch (error) {
    console.error('❌ India Manager restaurant access test failed:', error.response?.data || error.message);
  }
  
  // America Member should only see America restaurants
  try {
    const response = await axios.get(`${API_URL}/restaurants`, {
      headers: { 'x-auth-token': tokens.americaMember }
    });
    console.log(`✅ America Member can see ${response.data.length} restaurants`);
    
    // All restaurants should be from America
    const nonAmericaRestaurants = response.data.filter(r => r.country !== 'America');
    assert(nonAmericaRestaurants.length === 0, 'America Member should only see America restaurants');
    console.log('  - All restaurants are from America ✓');
  } catch (error) {
    console.error('❌ America Member restaurant access test failed:', error.response?.data || error.message);
  }
}

// Test food item creation for different roles
async function testFoodItemCreation() {
  console.log('\n--- Testing Food Item Creation ---');
  
  // Get restaurant IDs for testing
  let indiaRestaurantId, americaRestaurantId;
  
  try {
    const response = await axios.get(`${API_URL}/restaurants`, {
      headers: { 'x-auth-token': tokens.admin }
    });
    
    indiaRestaurantId = response.data.find(r => r.country === 'India')._id;
    americaRestaurantId = response.data.find(r => r.country === 'America')._id;
  } catch (error) {
    console.error('❌ Failed to get restaurant IDs:', error.response?.data || error.message);
    return;
  }
  
  // Admin should be able to create food items for both countries
  try {
    // Create food item for India restaurant
    await axios.post(`${API_URL}/fooditems`, {
      name: 'Test India Food (Admin)',
      description: 'Test food item created by admin for India',
      price: 9.99,
      restaurant: indiaRestaurantId
    }, {
      headers: { 'x-auth-token': tokens.admin }
    });
    
    // Create food item for America restaurant
    await axios.post(`${API_URL}/fooditems`, {
      name: 'Test America Food (Admin)',
      description: 'Test food item created by admin for America',
      price: 8.99,
      restaurant: americaRestaurantId
    }, {
      headers: { 'x-auth-token': tokens.admin }
    });
    
    console.log('✅ Admin can create food items for both countries');
  } catch (error) {
    console.error('❌ Admin food item creation test failed:', error.response?.data || error.message);
  }
  
  // India Manager should only be able to create food items for India
  try {
    // Create food item for India restaurant
    await axios.post(`${API_URL}/fooditems`, {
      name: 'Test India Food (Manager)',
      description: 'Test food item created by India manager',
      price: 7.99,
      restaurant: indiaRestaurantId
    }, {
      headers: { 'x-auth-token': tokens.indiaManager }
    });
    
    console.log('✅ India Manager can create food items for India');
    
    // Try to create food item for America restaurant (should fail)
    try {
      await axios.post(`${API_URL}/fooditems`, {
        name: 'Test America Food (India Manager)',
        description: 'This should fail',
        price: 6.99,
        restaurant: americaRestaurantId
      }, {
        headers: { 'x-auth-token': tokens.indiaManager }
      });
      
      console.error('❌ India Manager should not be able to create food items for America');
    } catch (error) {
      console.log('✅ India Manager correctly cannot create food items for America');
    }
  } catch (error) {
    console.error('❌ India Manager food item creation test failed:', error.response?.data || error.message);
  }
}

// Test order creation and management for different roles
async function testOrderManagement() {
  console.log('\n--- Testing Order Management ---');
  
  // Get food item IDs for testing
  let indiaFoodItemId, americaFoodItemId;
  
  try {
    const response = await axios.get(`${API_URL}/fooditems`, {
      headers: { 'x-auth-token': tokens.admin }
    });
    
    indiaFoodItemId = response.data.find(f => f.country === 'India')._id;
    americaFoodItemId = response.data.find(f => f.country === 'America')._id;
  } catch (error) {
    console.error('❌ Failed to get food item IDs:', error.response?.data || error.message);
    return;
  }
  
  // Admin should be able to create orders for both countries
  let adminIndiaOrderId, adminAmericaOrderId;
  
  try {
    // Create order with India food item
    const indiaOrderResponse = await axios.post(`${API_URL}/orders`, {
      items: [{ foodItem: indiaFoodItemId, quantity: 2 }],
      paymentMethod: 'credit_card'
    }, {
      headers: { 'x-auth-token': tokens.admin }
    });
    
    adminIndiaOrderId = indiaOrderResponse.data._id;
    
    // Create order with America food item
    const americaOrderResponse = await axios.post(`${API_URL}/orders`, {
      items: [{ foodItem: americaFoodItemId, quantity: 1 }],
      paymentMethod: 'paypal'
    }, {
      headers: { 'x-auth-token': tokens.admin }
    });
    
    adminAmericaOrderId = americaOrderResponse.data._id;
    
    console.log('✅ Admin can create orders for both countries');
  } catch (error) {
    console.error('❌ Admin order creation test failed:', error.response?.data || error.message);
  }
  
  // India Manager should only be able to create orders for India
  let indiaManagerOrderId;
  
  try {
    // Create order with India food item
    const indiaOrderResponse = await axios.post(`${API_URL}/orders`, {
      items: [{ foodItem: indiaFoodItemId, quantity: 3 }],
      paymentMethod: 'credit_card'
    }, {
      headers: { 'x-auth-token': tokens.indiaManager }
    });
    
    indiaManagerOrderId = indiaOrderResponse.data._id;
    console.log('✅ India Manager can create orders for India');
    
    // Try to create order with America food item (should fail)
    try {
      await axios.post(`${API_URL}/orders`, {
        items: [{ foodItem: americaFoodItemId, quantity: 1 }],
        paymentMethod: 'credit_card'
      }, {
        headers: { 'x-auth-token': tokens.indiaManager }
      });
      
      console.error('❌ India Manager should not be able to create orders for America');
    } catch (error) {
      console.log('✅ India Manager correctly cannot create orders for America');
    }
  } catch (error) {
    console.error('❌ India Manager order creation test failed:', error.response?.data || error.message);
  }
  
  // Team Member should not be able to create orders
  try {
    await axios.post(`${API_URL}/orders`, {
      items: [{ foodItem: indiaFoodItemId, quantity: 1 }],
      paymentMethod: 'credit_card'
    }, {
      headers: { 'x-auth-token': tokens.indiaMember }
    });
    
    console.error('❌ India Member should not be able to create orders');
  } catch (error) {
    console.log('✅ India Member correctly cannot create orders');
  }
  
  // Test order cancellation
  if (adminIndiaOrderId) {
    try {
      await axios.put(`${API_URL}/orders/${adminIndiaOrderId}/cancel`, {}, {
        headers: { 'x-auth-token': tokens.admin }
      });
      
      console.log('✅ Admin can cancel orders');
    } catch (error) {
      console.error('❌ Admin order cancellation test failed:', error.response?.data || error.message);
    }
  }
  
  // Test payment method update (admin only)
  if (adminAmericaOrderId) {
    try {
      await axios.put(`${API_URL}/orders/${adminAmericaOrderId}/payment`, {
        paymentMethod: 'bank_transfer'
      }, {
        headers: { 'x-auth-token': tokens.admin }
      });
      
      console.log('✅ Admin can update payment methods');
    } catch (error) {
      console.error('❌ Admin payment update test failed:', error.response?.data || error.message);
    }
    
    // India Manager should not be able to update payment methods
    try {
      await axios.put(`${API_URL}/orders/${adminAmericaOrderId}/payment`, {
        paymentMethod: 'cash'
      }, {
        headers: { 'x-auth-token': tokens.indiaManager }
      });
      
      console.error('❌ India Manager should not be able to update payment methods');
    } catch (error) {
      console.log('✅ India Manager correctly cannot update payment methods');
    }
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Food Ordering System API Tests');
  
  try {
    // Login with all user types
    await login('admin');
    await login('indiaManager');
    await login('americaManager');
    await login('indiaMember');
    await login('americaMember');
    
    // Run test suites
    await testRestaurantAccess();
    await testFoodItemCreation();
    await testOrderManagement();
    
    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run the tests
runTests();
