# Chaim Examples Java

This repository contains a focused example demonstrating how to use the Chaim OSS ecosystem to build, deploy, and generate Java SDKs from your data schemas using the **chaim-cli** tool.

## 🏗️ AWS Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Account                             │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │ Infrastructure      │    │ Application Stack           │ │
│  │ Stack               │    │                             │ │
│  │                     │    │ ┌─────────────────────────┐ │ │
│  │ • DynamoDB Table    │    │ │ Lambda Function         │ │ │
│  │ • API Gateway       │    │ │                         │ │ │
│  │ • IAM Roles         │    │ │ • Application Code      │ │ │
│  │ • ChaimBinder       │    │ │ • Generated SDK         │ │ │
│  │                     │    │ │ • All Dependencies      │ │ │
│  │ (Deploy once)       │    │ └─────────────────────────┘ │ │
│  └─────────────────────┘    │                             │ │
│                             │ (Deploy on code changes)    │ │
│                             └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow**: Client → API Gateway → Lambda (with generated SDK) → DynamoDB

## 🚀 Complete Workflow Example

This repository demonstrates the complete end-to-end workflow using a simple **Orders Management System**:

1. **Schema Definition** - Define your order data model using `.bprint` files
2. **CDK Deployment** - Deploy infrastructure using ChaimBinder
3. **Java SDK Generation** - Generate type-safe Java clients using `chaim-cli`
4. **Application Integration** - Use the generated SDK in your Java applications

## 📁 Repository Structure

```
chaim-examples-java/
├── schemas/ # .bprint schema definitions
│   └── orders.bprint # Orders entity schema
├── cdk-stacks/ # CDK deployment examples
│   └── orders-stack.ts # Orders infrastructure
├── generated-sdks/ # Generated Java SDKs
│   └── ordersstack-sdk/ # Orders Java SDK
├── java-applications/ # Example Java applications
│   └── orders-app/ # Orders application
├── scripts/ # Automation scripts
│   ├── deploy.sh # Deployment script
│   ├── generate-sdk.sh # SDK generation script
│   └── test-end-to-end.sh # End-to-end testing
└── docs/ # Documentation
└── getting-started.md # Quick start guide

```

## 🎯 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Java** (for code generation)
- **AWS Credentials** configured: `aws configure`
- **CDK CLI** installed
- **chaim-cli** installed

### Install chaim-cli

```bash
# Install chaim-cli globally
npm install -g @chaim/cli

# Or use npx for one-time usage
npx @chaim/cli generate --help
```

### 1. Validate Your Schema

First, validate your `.bprint` schema files:

```bash
# Validate a single schema file
chaim validate schemas/orders.bprint

# The CLI will show validation results:
# ✓ Schema is valid
#   Entity: orderId
#   Version: v1
#   Fields: 5
```

### 2. Deploy Infrastructure (One Time)

Deploy the infrastructure stack that contains DynamoDB, API Gateway, and IAM roles:

```bash
# Deploy infrastructure (DynamoDB, API Gateway, IAM roles)
./scripts/deploy-infrastructure.sh OrdersInfrastructureStack
```

This creates:
- DynamoDB table for orders
- API Gateway for REST endpoints
- IAM roles with proper permissions
- ChaimBinder for schema registration

### 3. Generate Java SDK

Generate the Java SDK from your deployed infrastructure:

```bash
# Generate SDK from infrastructure stack
chaim generate --stack OrdersInfrastructureStack --package com.example.orders

# With custom output directory
chaim generate --stack OrdersInfrastructureStack --package com.example.orders --output ./generated-sdks
```

### 4. Build Application

Build your Java application with the generated SDK:

```bash
# Build application with generated SDK
./scripts/build-application.sh
```

### 5. Deploy Application (When Code Changes)

Deploy the application stack with your business logic:

```bash
# Deploy application code to Lambda
./scripts/deploy-application.sh OrdersInfrastructureStack OrdersApplicationStack
```

## 🔧 CLI Commands Reference

### Generate SDK
```bash
# Generate from infrastructure stack
chaim generate --stack OrdersInfrastructureStack --package com.example.orders

# With all options
chaim generate \
  --stack OrdersInfrastructureStack \
  --package com.example.orders \
  --output ./generated-sdks \
  --region us-east-1
```

### Validate Schema
```bash
# Validate a .bprint schema file
chaim validate schemas/orders.bprint
```

### Check Environment
```bash
# Check system environment and dependencies
chaim doctor
```

## 📚 Orders Example Features

This example demonstrates:

- **Order Creation** - Create orders with customer information and items
- **Status Management** - Update order status through the lifecycle
- **Customer Queries** - Find all orders for a specific customer
- **Data Validation** - Type-safe operations with generated Java classes
- **AWS Integration** - Full integration with DynamoDB, Lambda, and API Gateway

## 🧪 Testing

Run the complete end-to-end test suite:

```bash
./scripts/test-end-to-end.sh
```

This will:
1. Validate all schemas using `chaim validate`
2. Deploy infrastructure
3. Generate SDKs using `chaim generate`
4. Compile Java applications
5. Run integration tests

## 🔍 Troubleshooting

### Common Issues

1. **Stack not found**: Ensure your CDK stack is deployed and accessible
2. **AWS credentials**: Run `aws configure` to set up credentials
3. **Java not found**: Install Java 11+ for code generation
4. **Package name required**: Always specify `--package` when generating

## 📖 Documentation

- [Getting Started Guide](docs/getting-started.md) - Step-by-step tutorial for the orders example
- [chaim-cli Documentation](https://github.com/chaim-builder/chaim-cli) - Complete CLI reference

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [chaim-bprint-spec](https://github.com/chaim-builder/chaim-bprint-spec) - Schema specification and validation
- [chaim-cdk](https://github.com/chaim-builder/chaim-cdk) - AWS CDK constructs for infrastructure
- [chaim-cli](https://github.com/chaim-builder/chaim-cli) - Command-line tools for SDK generation
- [chaim-client-java](https://github.com/chaim-builder/chaim-client-java) - Java client library