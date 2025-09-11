# Getting Started with Chaim Orders Example

This guide will walk you through the complete workflow of using Chaim to build, deploy, and generate Java SDKs using a simple **Orders Management System**.

## 🎯 What You'll Learn

By the end of this tutorial, you'll understand how to:
1. Define an orders schema using `.bprint` files
2. Deploy infrastructure using ChaimBinder
3. Generate type-safe Java SDKs
4. Build a Java application using the generated SDKs

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Java 11+** - [Download here](https://adoptium.net/)
- **AWS CLI** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **CDK CLI** - Install with `npm install -g aws-cdk`
- **Maven** - [Download here](https://maven.apache.org/download.cgi)

### AWS Setup

1. Configure AWS credentials:
   ```bash
   aws configure
   ```

2. Bootstrap CDK in your region:
   ```bash
   cdk bootstrap
   ```

## 🚀 Quick Start

### Step 1: Clone and Setup

```bash
git clone https://github.com/chaim-builder/chaim-examples-java.git
cd chaim-examples-java
```

### Step 2: Review the Orders Schema

The orders schema is already defined in `schemas/orders.bprint`. Let's examine it:

```json
{
  "schemaVersion": "v1",
  "namespace": "example.orders",
  "description": "Simple order management system",
  "entity": {
    "name": "Order",
    "primaryKey": { "partitionKey": "orderId" },
    "fields": [
      { "name": "orderId", "type": "string", "required": true },
      { "name": "customerId", "type": "string", "required": true },
      { "name": "customerName", "type": "string", "required": true },
      { "name": "customerEmail", "type": "string", "required": true },
      { "name": "totalAmount", "type": "number", "required": true },
      { "name": "status", "type": "string", "enum": ["pending", "confirmed", "shipped", "delivered"], "required": true }
    ]
  }
}
```

This schema defines an Order entity with customer information, order details, and status tracking.

### Step 3: Deploy Infrastructure

Deploy the orders infrastructure:

```bash
./scripts/deploy.sh OrdersStack
```

This will:
- Validate the orders schema
- Deploy AWS infrastructure using ChaimBinder
- Create DynamoDB table, Lambda functions, and API Gateway endpoints

### Step 4: Generate Java SDK

Generate a type-safe Java SDK from your deployed infrastructure:

```bash
./scripts/generate-sdk.sh OrdersStack
```

This creates a complete Maven project with:
- Generated `Order` Java class
- `OrderClient` for API operations
- Proper Maven configuration

### Step 5: Run the Example Application

The example application is already created in `java-applications/orders-app`. Let's run it:

```bash
cd java-applications/orders-app
mvn clean compile exec:java -Dexec.mainClass="com.example.orders.OrdersApplication"
```

This will demonstrate:
- Creating orders
- Updating order status
- Querying orders by customer
- Displaying order summaries

## 📚 Orders Example Features

This focused example demonstrates:

### Order Management
- **Order Creation** - Create orders with customer information and items
- **Status Tracking** - Update order status through the lifecycle (pending → confirmed → shipped → delivered)
- **Customer Queries** - Find all orders for a specific customer
- **Data Validation** - Type-safe operations with generated Java classes

### AWS Integration
- **DynamoDB** - NoSQL database for order storage
- **Lambda Functions** - Serverless functions for CRUD operations
- **API Gateway** - REST API endpoints for order management
- **CloudWatch** - Logging and monitoring

## 🧪 Testing

Run the complete end-to-end test suite:

```bash
./scripts/test-end-to-end.sh
```

This validates:
- Schema syntax and structure
- CDK deployment readiness
- Java SDK generation
- Application compilation
- Integration testing

## 🔧 Advanced Usage

### Multi-Domain Deployment

Deploy multiple business domains in a single stack:

```bash
./scripts/deploy.sh MultiDomainStack
```

### Custom Configuration

Modify the CDK stacks to customize:
- Environment settings
- Security configurations
- Performance optimizations
- Compliance requirements

### Schema Annotations

Use annotations to add metadata:

```json
{
  "entity": {
    "name": "Patient",
    "fields": [...],
    "annotations": {
      "pii": true,
      "hipaa": "required",
      "encryption": "required",
      "retention": "7years"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**Schema Validation Errors**
- Check JSON syntax in your `.bprint` files
- Ensure all required fields are present
- Validate field types and constraints

**Deployment Failures**
- Verify AWS credentials are configured
- Check CDK bootstrap status
- Review CloudFormation stack events

**SDK Generation Issues**
- Ensure the stack is successfully deployed
- Check Chaim CLI installation
- Verify stack name and region

**Java Compilation Errors**
- Ensure Java 11+ is installed
- Check Maven configuration
- Verify generated SDK dependencies

### Getting Help

- Check the [Advanced Usage Guide](advanced-usage.md)
- Review [Best Practices](best-practices.md)
- Open an issue on GitHub
- Join our community discussions

## 🎉 Next Steps

Now that you've completed the getting started guide:

1. **Explore Advanced Features** - Read the [Advanced Usage Guide](advanced-usage.md)
2. **Learn Best Practices** - Review [Best Practices](best-practices.md)
3. **Build Your Own Application** - Use the examples as templates
4. **Contribute** - Help improve the examples and documentation

Happy coding with Chaim! 🚀
