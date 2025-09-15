# Chaim Examples Java

A complete example demonstrating how to use the Chaim OSS ecosystem to build, deploy, and generate Java SDKs from data schemas.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Account                              │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │ Infrastructure      │    │ Application Stack           │ │
│  │ Stack               │    │                             │ │
│  │                     │    │ ┌─────────────────────────┐ │ │
│  │ • DynamoDB Table    │    │ │ Lambda Function         │ │ │
│  │ • API Gateway       │    │ │                         │ │ │
│  │ • IAM Roles         │    │ │ • Application Code      │ │ │
│  │                     │    │ │ • Generated SDK         │ │ │
│  │ (Deploy once)       │    │ │ • All Dependencies      │ │ │
│  └─────────────────────┘    │ └─────────────────────────┘ │ │
│                             │ (Deploy on code changes)    │ │
│                             └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow**: Client → API Gateway → Lambda (with generated SDK) → DynamoDB

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Java** (11+)
- **AWS CLI** configured: `aws configure`
- **CDK CLI** installed
- **chaim-cli** installed

### 1. Deploy Infrastructure

```bash
# Deploy infrastructure (DynamoDB, API Gateway, IAM roles)
./scripts/deploy-infrastructure.sh OrdersInfrastructureStack
```

### 2. Generate Java SDK

```bash
# Generate SDK from infrastructure stack
chaim generate --stack OrdersInfrastructureStack --package com.example.orders --output ./generated-sdks
```

**Note**: The `generated-sdks/` directory is ignored by git. Each developer generates their own SDK locally.

### 3. Build & Deploy Application

```bash
# Build application with generated SDK
./scripts/build-application.sh

# Deploy application to Lambda
./scripts/deploy-application.sh OrdersInfrastructureStack OrdersApplicationStack
```

## 📁 Project Structure

```
chaim-examples-java/
├── schemas/                    # .bprint schema definitions
│   └── orders.bprint          # Orders entity schema
├── cdk-stacks/                # CDK deployment stacks
│   ├── app.ts                 # Main CDK app
│   ├── orders-infrastructure-stack.ts
│   └── orders-application-stack.ts
├── generated-sdks/            # Generated Java SDKs (ignored by git)
│   └── ordersstack-sdk/       # Orders Java SDK
├── java-applications/         # Example Java applications
│   └── orders-app/            # Orders application
└── scripts/                   # Automation scripts
    ├── deploy-infrastructure.sh
    ├── deploy-application.sh
    └── build-application.sh
```

## 💻 Using the Generated SDK

The generated SDK provides a `ChaimMapperClient` for type-safe DynamoDB operations:

```java
import com.example.orders.Order;
import com.example.orders.ChaimMapperClient;
import com.example.orders.ChaimConfig;

public class OrdersApplication {
    private final ChaimMapperClient mapper;
    
    public OrdersApplication() {
        this.mapper = ChaimConfig.createMapper();
    }
    
    public void createOrder() {
        Order order = new Order("ORD-123", "CUST-456", 99.99, "USD");
        mapper.save(order);
    }
    
    public Order findOrder(String orderId) {
        return mapper.findById(Order.class, orderId).orElse(null);
    }
    
    public List<Order> findOrdersByCustomer(String customerId) {
        return mapper.findByField(Order.class, "customerId", customerId);
    }
}
```

## 🔧 Development Workflow

### Initial Setup (Run Once)
```bash
./scripts/deploy-infrastructure.sh OrdersInfrastructureStack
chaim generate --stack OrdersInfrastructureStack --package com.example.orders
./scripts/build-application.sh
./scripts/deploy-application.sh OrdersInfrastructureStack OrdersApplicationStack
```

### Code Changes
```bash
# Update Java code, then:
./scripts/build-application.sh
./scripts/deploy-application.sh OrdersInfrastructureStack OrdersApplicationStack
```

### Schema Changes
```bash
# Update .bprint files, then:
chaim validate schemas/orders.bprint
./scripts/deploy-infrastructure.sh OrdersInfrastructureStack  # if needed
chaim generate --stack OrdersInfrastructureStack --package com.example.orders
./scripts/build-application.sh
./scripts/deploy-application.sh OrdersInfrastructureStack OrdersApplicationStack
```

## 🧪 Testing

```bash
# Test the deployed application
./scripts/test-end-to-end.sh
```

## 🔍 Troubleshooting

- **Stack not found**: Ensure CDK stack is deployed
- **AWS credentials**: Run `aws configure`
- **Java not found**: Install Java 11+
- **Package name required**: Always specify `--package` when generating

## 🔗 Related Projects

- [chaim-bprint-spec](https://github.com/chaim-builder/chaim-bprint-spec) - Schema specification
- [chaim-cdk](https://github.com/chaim-builder/chaim-cdk) - AWS CDK constructs
- [chaim-cli](https://github.com/chaim-builder/chaim-cli) - Command-line tools
- [chaim-client-java](https://github.com/chaim-builder/chaim-client-java) - Java client library

## 📄 License

Apache-2.0 License - see [LICENSE](LICENSE) file for details.