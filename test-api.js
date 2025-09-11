#!/usr/bin/env node

/**
 * Local API Test Script for Orders Management
 * This script simulates the API Gateway + Lambda functionality locally
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (simulating DynamoDB)
let orders = [
  {
    orderId: 'ORD-001',
    customerId: 'CUST-001',
    amount: 99.99,
    currency: 'USD',
    createdAt: new Date().toISOString()
  },
  {
    orderId: 'ORD-002',
    customerId: 'CUST-002',
    amount: 149.50,
    currency: 'USD',
    createdAt: new Date().toISOString()
  }
];

// Helper function to find order by ID
function findOrderById(orderId) {
  return orders.find(order => order.orderId === orderId);
}

// Helper function to get orders by customer
function getOrdersByCustomer(customerId) {
  return orders.filter(order => order.customerId === customerId);
}

// API Routes

// GET /orders - List all orders
app.get('/orders', (req, res) => {
  console.log('GET /orders - Listing all orders');
  res.json({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(orders)
  });
});

// POST /orders - Create new order
app.post('/orders', (req, res) => {
  console.log('POST /orders - Creating new order:', req.body);
  
  const { customerId, amount, currency } = req.body;
  
  if (!customerId || !amount) {
    return res.status(400).json({
      statusCode: 400,
      body: JSON.stringify({ error: 'customerId and amount are required' })
    });
  }
  
  const orderId = req.body.orderId || `ORD-${Date.now()}`;
  const order = {
    orderId,
    customerId,
    amount: parseFloat(amount),
    currency: currency || 'USD',
    createdAt: new Date().toISOString()
  };
  
  // Check if order already exists
  if (findOrderById(orderId)) {
    return res.status(409).json({
      statusCode: 409,
      body: JSON.stringify({ error: 'Order already exists' })
    });
  }
  
  orders.push(order);
  
  res.status(201).json({
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(order)
  });
});

// GET /orders/:orderId - Get specific order
app.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  console.log(`GET /orders/${orderId} - Getting order`);
  
  const order = findOrderById(orderId);
  
  if (!order) {
    return res.status(404).json({
      statusCode: 404,
      body: JSON.stringify({ error: 'Order not found' })
    });
  }
  
  res.json({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(order)
  });
});

// PUT /orders/:orderId - Update order
app.put('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  console.log(`PUT /orders/${orderId} - Updating order:`, req.body);
  
  const orderIndex = orders.findIndex(order => order.orderId === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      statusCode: 404,
      body: JSON.stringify({ error: 'Order not found' })
    });
  }
  
  const updateData = req.body;
  const updatedOrder = {
    ...orders[orderIndex],
    ...updateData,
    orderId // Ensure orderId doesn't change
  };
  
  orders[orderIndex] = updatedOrder;
  
  res.json({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(updatedOrder)
  });
});

// DELETE /orders/:orderId - Delete order
app.delete('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  console.log(`DELETE /orders/${orderId} - Deleting order`);
  
  const orderIndex = orders.findIndex(order => order.orderId === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      statusCode: 404,
      body: JSON.stringify({ error: 'Order not found' })
    });
  }
  
  const deletedOrder = orders[orderIndex];
  orders.splice(orderIndex, 1);
  
  res.json({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      message: 'Order deleted successfully', 
      order: deletedOrder 
    })
  });
});

// GET /orders/customer/:customerId - Get orders by customer
app.get('/orders/customer/:customerId', (req, res) => {
  const { customerId } = req.params;
  console.log(`GET /orders/customer/${customerId} - Getting orders for customer`);
  
  const customerOrders = getOrdersByCustomer(customerId);
  
  res.json({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(customerOrders)
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ordersCount: orders.length 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Orders API Server Started');
  console.log('================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  GET    /orders                    - List all orders');
  console.log('  POST   /orders                    - Create new order');
  console.log('  GET    /orders/:orderId           - Get specific order');
  console.log('  PUT    /orders/:orderId           - Update order');
  console.log('  DELETE /orders/:orderId           - Delete order');
  console.log('  GET    /orders/customer/:customerId - Get orders by customer');
  console.log('');
  console.log('🧪 Test the API with curl:');
  console.log('  curl http://localhost:3000/orders');
  console.log('  curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d \'{"customerId":"CUST-003","amount":199.99}\'');
  console.log('');
  console.log('📊 Current orders in database:', orders.length);
});

module.exports = app;

