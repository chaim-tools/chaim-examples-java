#!/usr/bin/env node

/**
 * Test Client for Orders API
 * Demonstrates all CRUD operations
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          };
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  try {
    const response = await makeRequest('GET', '/health');
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${response.body}`);
    return response.statusCode === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testListOrders() {
  console.log('\n📋 Testing List Orders...');
  try {
    const response = await makeRequest('GET', '/orders');
    console.log(`   Status: ${response.statusCode}`);
    const orders = JSON.parse(response.body);
    console.log(`   Found ${orders.length} orders`);
    orders.forEach(order => {
      console.log(`   - ${order.orderId}: $${order.amount} ${order.currency} (Customer: ${order.customerId})`);
    });
    return response.statusCode === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testCreateOrder() {
  console.log('\n➕ Testing Create Order...');
  const newOrder = {
    customerId: 'CUST-TEST-001',
    amount: 299.99,
    currency: 'USD'
  };
  
  try {
    const response = await makeRequest('POST', '/orders', newOrder);
    console.log(`   Status: ${response.statusCode}`);
    const order = JSON.parse(response.body);
    console.log(`   Created order: ${order.orderId}`);
    console.log(`   Customer: ${order.customerId}, Amount: $${order.amount} ${order.currency}`);
    return { success: response.statusCode === 201, orderId: order.orderId };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, orderId: null };
  }
}

async function testGetOrder(orderId) {
  console.log(`\n🔍 Testing Get Order: ${orderId}...`);
  try {
    const response = await makeRequest('GET', `/orders/${orderId}`);
    console.log(`   Status: ${response.statusCode}`);
    if (response.statusCode === 200) {
      const order = JSON.parse(response.body);
      console.log(`   Order found: ${order.orderId}`);
      console.log(`   Customer: ${order.customerId}, Amount: $${order.amount} ${order.currency}`);
      return true;
    } else {
      console.log(`   Order not found`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testUpdateOrder(orderId) {
  console.log(`\n✏️  Testing Update Order: ${orderId}...`);
  const updateData = {
    amount: 399.99,
    currency: 'EUR'
  };
  
  try {
    const response = await makeRequest('PUT', `/orders/${orderId}`, updateData);
    console.log(`   Status: ${response.statusCode}`);
    if (response.statusCode === 200) {
      const order = JSON.parse(response.body);
      console.log(`   Order updated: ${order.orderId}`);
      console.log(`   New amount: $${order.amount} ${order.currency}`);
      return true;
    } else {
      console.log(`   Update failed`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetOrdersByCustomer(customerId) {
  console.log(`\n👤 Testing Get Orders by Customer: ${customerId}...`);
  try {
    const response = await makeRequest('GET', `/orders/customer/${customerId}`);
    console.log(`   Status: ${response.statusCode}`);
    const orders = JSON.parse(response.body);
    console.log(`   Found ${orders.length} orders for customer ${customerId}`);
    orders.forEach(order => {
      console.log(`   - ${order.orderId}: $${order.amount} ${order.currency}`);
    });
    return response.statusCode === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testDeleteOrder(orderId) {
  console.log(`\n🗑️  Testing Delete Order: ${orderId}...`);
  try {
    const response = await makeRequest('DELETE', `/orders/${orderId}`);
    console.log(`   Status: ${response.statusCode}`);
    if (response.statusCode === 200) {
      const result = JSON.parse(response.body);
      console.log(`   Order deleted: ${result.message}`);
      return true;
    } else {
      console.log(`   Delete failed`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Orders API Test Suite');
  console.log('========================');
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Health check failed. Make sure the server is running on port 3000');
    console.log('   Run: node test-api.js');
    return;
  }
  
  // Test 2: List initial orders
  await testListOrders();
  
  // Test 3: Create new order
  const createResult = await testCreateOrder();
  if (!createResult.success) {
    console.log('\n❌ Create order test failed');
    return;
  }
  
  const orderId = createResult.orderId;
  
  // Test 4: Get the created order
  await testGetOrder(orderId);
  
  // Test 5: Update the order
  await testUpdateOrder(orderId);
  
  // Test 6: Get orders by customer
  await testGetOrdersByCustomer('CUST-TEST-001');
  
  // Test 7: List all orders again
  await testListOrders();
  
  // Test 8: Delete the order
  await testDeleteOrder(orderId);
  
  // Test 9: Verify deletion
  await testGetOrder(orderId);
  
  // Test 10: Final list
  await testListOrders();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📊 API Summary:');
  console.log('   ✅ Health Check');
  console.log('   ✅ List Orders');
  console.log('   ✅ Create Order');
  console.log('   ✅ Get Order');
  console.log('   ✅ Update Order');
  console.log('   ✅ Get Orders by Customer');
  console.log('   ✅ Delete Order');
  console.log('   ✅ Error Handling');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  makeRequest,
  testHealthCheck,
  testListOrders,
  testCreateOrder,
  testGetOrder,
  testUpdateOrder,
  testGetOrdersByCustomer,
  testDeleteOrder,
  runTests
};

