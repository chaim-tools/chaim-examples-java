# Changelog - chaim-examples-java

## [0.2.0] - 2026-01-16

### Updated for Chaim v0.2.0 Ecosystem

This release updates the examples to work with the new Chaim v0.2.0 ecosystem, featuring flattened schema structure and simplified CDK API.

### 🎯 Schema Format Changes (chaim-bprint-spec v0.2.0)

**BREAKING:** Schema structure is now flattened

#### Before (v0.1.x - Nested Structure):
```json
{
  "schemaVersion": "v1",
  "namespace": "acme.products",
  "entity": {
    "name": "Product",
    "primaryKey": { "partitionKey": "productId" },
    "fields": [...]
  }
}
```

#### After (v1.0 - Flattened Structure):
```json
{
  "schemaVersion": 1.0,
  "entityName": "Product",
  "description": "Product catalog",
  "primaryKey": { "partitionKey": "productId" },
  "fields": [...]
}
```

**Key Changes:**
- `entity.name` → `entityName` (top-level)
- `entity.primaryKey` → `primaryKey` (top-level)
- `entity.fields` → `fields` (top-level)
- `schemaVersion` now uses numeric format (1.0 instead of "v1")
- `namespace` field removed (use conventions in entityName instead)

#### New Features:

**Field Constraints** (Built-in validation):
```json
{
  "name": "email",
  "type": "string",
  "constraints": {
    "minLength": 5,
    "maxLength": 254,
    "pattern": "^[^@]+@[^@]+\\.[^@]+$"
  }
}
```

Supported constraints:
- String: `minLength`, `maxLength`, `pattern` (regex)
- Number: `min`, `max`

**Field Annotations** (Custom metadata):
```json
{
  "name": "price",
  "type": "number",
  "annotations": {
    "currency": "USD",
    "precision": 2,
    "displayFormat": "currency"
  }
}
```

### 🔧 CDK API Changes (chaim-cdk v0.1.0)

**IMPROVED:** Better organized binding configuration

#### Before (v0.1.x):
```typescript
new ChaimDynamoDBBinder(this, 'ProductSchema', {
  schemaPath: './schemas/product.bprint',
  table: productTable,
  appId: 'my-app',
  credentials: ChaimCredentials.fromApiKeys(...),
  failureMode: FailureMode.BEST_EFFORT,
});
```

#### After (v0.1.0 with TableBindingConfig):
```typescript
const config = new TableBindingConfig(
  'my-app',
  ChaimCredentials.fromApiKeys(...),
  FailureMode.BEST_EFFORT
);

new ChaimDynamoDBBinder(this, 'ProductSchema', {
  schemaPath: './schemas/product.bprint',
  table: productTable,
  config: config,
});
```

**Benefits:**
- ✅ Single `config` parameter instead of multiple individual parameters
- ✅ Easy to share configuration across multiple entities (single-table design)
- ✅ More consistent with CDK L2 construct patterns
- ✅ Better TypeScript type safety

### 📦 Updated Files

**Schema Files:**
- `schemas/product-catalog.bprint` - Updated to v1.0 format with constraints
- `schemas/customer.bprint` - Updated to v1.0 format
- `schemas/order-item.bprint` - Updated to v1.0 format with constraints
- `schemas/orders.bprint` - Updated to v1.0 format

**CDK Stacks:**
- `cdk-stacks/product-catalog-stack.ts` - Now uses `TableBindingConfig`
- `cdk-stacks/single-table-example.ts` - Now uses `TableBindingConfig`

**Documentation:**
- `README.md` - Complete rewrite with v0.2.0 examples
- `CHAIM_CONTEXT.md` - Updated with current API and version information
- `CHANGELOG.md` - New file documenting changes

### 🚀 Generated Code

No changes to generated Java code structure. The generator produces the same high-quality DTOs, repositories, and configuration regardless of schema format changes.

### 🔄 Migration Steps

For users upgrading from v0.1.x:

1. **Update schema files** to flattened structure
2. **Update CDK stacks** to use `TableBindingConfig`
3. **Delete old snapshots**: `rm -rf ~/.chaim/cache/snapshots/`
4. **Re-synthesize**: `npx cdk synth`
5. **Regenerate code**: `chaim generate --stack YourStack --package com.your.package`

### ⚠️ Breaking Changes

- Old snapshots (nested `entity` structure) will fail to parse
- Schema files must be updated to flattened structure
- CDK API using individual parameters (appId, credentials, failureMode) is deprecated but still works

### ✅ Backward Compatibility

- Generated Java code structure is unchanged
- Existing Java applications don't need updates
- Old CDK API parameters still work (deprecated)

---

## [0.1.0] - 2025-11-15

### Initial Release

Complete working example demonstrating:
- `.bprint` schema definition
- CDK stack with `ChaimDynamoDBBinder`
- Java SDK generation with `chaim generate`
- Sample Java application using generated code

**Included:**
- Product catalog example with composite keys
- Single-table design example with multiple entities
- Complete automation scripts
- Comprehensive documentation
