# Chaim Examples - Java

**A complete working example of the Chaim workflow: schema → CDK → generated Java SDK → application.**

This example demonstrates:
- Defining DynamoDB schemas with `.bprint` files
- Deploying infrastructure with AWS CDK + ChaimDynamoDBBinder
- Generating type-safe Java SDKs from snapshots
- Using generated code in applications

Two examples included:
- **ProductCatalogStack** - Simple single-entity example (recommended starting point)
- **SingleTableExampleStack** - Advanced multi-entity single-table design

## Quick Start

**Prerequisites:** Node.js 18+, Java 11+, Maven 3.6+, AWS CLI configured

```bash
# 1. Install dependencies
npm install

# 2. Run complete workflow (synth + generate + build SDK)
./scripts/synth-and-generate.sh ProductCatalogStack com.acme.products

# 3. Deploy to AWS (optional - generation works without deploy)
npx cdk deploy ProductCatalogStack

# 4. Run demo application
cd java-applications/product-demo
mvn compile exec:java -Dexec.mainClass="com.acme.demo.ProductCatalogDemo"
```

## Repository Structure

```
chaim-examples-java/
├── schemas/              # .bprint schema definitions
├── cdk-stacks/           # AWS CDK infrastructure
├── generated-sdks/       # Generated Java SDKs (gitignored)
├── java-applications/    # Demo applications
└── scripts/              # Automation scripts
```

## The Workflow

### 1. Define Schema (`schemas/product-catalog.bprint`)

```json
{
  "schemaVersion": 1.0,
  "entityName": "Product",
  "primaryKey": {
    "partitionKey": "productId",
    "sortKey": "category"
  },
  "fields": [
    { "name": "productId", "type": "string", "required": true },
    { "name": "category", "type": "string", "required": true },
    { "name": "name", "type": "string", "required": true },
    { "name": "price", "type": "number", "required": true }
  ]
}
```

### 2. Create CDK Stack with ChaimDynamoDBBinder

```typescript
import { ChaimDynamoDBBinder, ChaimCredentials, TableBindingConfig } from '@chaim-tools/cdk-lib';

const table = new dynamodb.Table(this, 'ProductTable', {
  partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'category', type: dynamodb.AttributeType.STRING }
});

const config = new TableBindingConfig('my-app', ChaimCredentials.fromApiKeys(...));

new ChaimDynamoDBBinder(this, 'ProductSchema', {
  schemaPath: './schemas/product-catalog.bprint',
  table,
  config
});
```

### 3. Generate & Use

```bash
# Generate snapshot + SDK
npx cdk synth ProductCatalogStack
chaim generate --stack ProductCatalogStack --package com.acme.products

# Use in Java application
ProductRepository repo = ChaimConfig.productRepository();
Product product = Product.builder()
    .productId("PROD-001")
    .category("Electronics")
    .name("Smart Speaker")
    .price(149.99)
    .build();
repo.save(product);
```

## Snapshot Cache Management

Enable automatic cleanup in `cdk.json` to prevent stale snapshot issues:

```json
{
  "context": {
    "chaimSnapshotCachePolicy": "PRUNE_STACK"  // Recommended
  }
}
```

Or use manual cleanup: `chaim clean --stack ProductCatalogStack`

## Key Features

- **Schema-first development** - Define entities in `.bprint` files
- **Type-safe Java SDKs** - Generate DTOs, repositories, and config
- **Local development** - Generate code without AWS deployment
- **Field constraints** - Built-in validation (minLength, maxLength, pattern, min, max)
- **Annotations** - Custom metadata for tooling and documentation
- **Single-table design** - Share config across multiple entities

## Related Projects

| Project | Purpose |
|---------|---------|
| [chaim-bprint-spec](../chaim-bprint-spec) | Schema format specification |
| [chaim-cdk](../chaim-cdk) | AWS CDK L2 constructs |
| [chaim-cli](../chaim-cli) | CLI tools (generate, validate, clean) |
| [chaim-client-java](../chaim-client-java) | Java code generator |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No snapshot found" | Run `npx cdk synth ProductCatalogStack` |
| "AWS credentials not configured" | Run `aws configure` |
| Maven/Lombok errors | Enable annotation processing in IDE |
| Table not found at runtime | Deploy: `npx cdk deploy ProductCatalogStack` |

For migration guides and detailed changelogs, see [CHANGELOG.md](CHANGELOG.md).

## License

Apache-2.0
