
package com.example.orders;

import com.example.orders.Order;
import com.example.orders.ChaimMapperClient;
import com.example.orders.ChaimConfig;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;

/**
 * Example Orders Application demonstrating Chaim-generated SDK usage
 * 
 * This application shows how to:
 * 1. Create orders with customer information
 * 2. Update order status
 * 3. Query and display orders
 * 4. Handle the complete orders workflow
 */
public class OrdersApplication {
    
    private final ChaimMapperClient mapper;
    
    public OrdersApplication() {
        // Initialize mapper client from generated configuration
        this.mapper = ChaimConfig.createMapper();
    }
    
    public static void main(String[] args) {
        OrdersApplication app = new OrdersApplication();
        
        try {
            System.out.println("🚀 Starting Orders Application Demo");
            System.out.println("===================================");
            
            // Demo the complete workflow
            app.runDemo();
            
        } catch (Exception e) {
            System.err.println("❌ Error running demo: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void runDemo() {
        System.out.println("\n📋 Orders Workflow Demo");
        System.out.println("======================");
        
        // Step 1: Create an order
        Order order = createOrder();
        System.out.println("✅ Created order: " + order.getOrderId());
        
        // Step 2: Update order amount
        updateOrderStatus(order.getOrderId(), "confirmed");
        System.out.println("✅ Updated order amount (+$10)");
        
        // Step 3: Update order amount again
        updateOrderStatus(order.getOrderId(), "shipped");
        System.out.println("✅ Updated order amount again (+$10)");
        
        // Step 4: Display order summary
        displayOrderSummary(order);
        
        // Step 5: Query orders by customer
        queryOrdersByCustomer(order.getCustomerId());
        
        System.out.println("\n🎉 Demo completed successfully!");
    }
    
    private Order createOrder() {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8);
        String customerId = "CUST-" + UUID.randomUUID().toString().substring(0, 8);
        
        Order order = new Order(orderId, customerId, 99.99, "USD");
            
        mapper.save(order);
        return order;
    }
    
    private void updateOrderStatus(String orderId, String status) {
        Optional<Order> orderOpt = mapper.findById(Order.class, orderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            // Note: Since we simplified the schema, we'll just update the amount as an example
            order.setAmount(order.getAmount() + 10.0); // Add $10 to the order
            
            mapper.update(order);
        }
    }
    
    private void displayOrderSummary(Order order) {
        System.out.println("\n📄 Order Summary");
        System.out.println("================");
        System.out.println("Order ID: " + order.getOrderId());
        System.out.println("Customer ID: " + order.getCustomerId());
        System.out.println("Amount: $" + order.getAmount() + " " + order.getCurrency());
    }
    
    private void queryOrdersByCustomer(String customerId) {
        System.out.println("\n🔍 Querying orders for customer: " + customerId);
        List<Order> orders = mapper.findByField(Order.class, "customerId", customerId);
        System.out.println("Found " + orders.size() + " orders for this customer");
        
        for (Order order : orders) {
            System.out.println("  - " + order.getOrderId() + " - $" + order.getAmount() + " " + order.getCurrency());
        }
    }
}
