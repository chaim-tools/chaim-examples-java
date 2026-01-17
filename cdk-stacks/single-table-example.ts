#!/usr/bin/env node
/**
 * Single-Table Design Example Stack
 * 
 * Demonstrates binding multiple entities to a single DynamoDB table
 * using shared TableBindingConfig to ensure consistency.
 * 
 * This stack shows the recommended pattern for single-table design:
 * 1. Create ONE TableBindingConfig with appId and credentials
 * 2. Share that config across ALL entity bindings for the table
 * 3. Each entity gets its own ChaimDynamoDBBinder but uses the same config
 * 
 * Usage:
 *   # Synthesize (creates LOCAL snapshots for all entities)
 *   npx cdk synth SingleTableExampleStack
 * 
 *   # Generate Java SDK for all entities
 *   npx chaim generate --stack SingleTableExampleStack --package com.acme.ecommerce --output ./generated-sdks
 * 
 *   # Deploy to AWS
 *   npx cdk deploy SingleTableExampleStack
 */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

// Import from local chaim-cdk (linked via package.json)
import {
  ChaimDynamoDBBinder,
  ChaimCredentials,
  TableBindingConfig,
} from '@chaim-tools/cdk-lib';

export interface SingleTableExampleStackProps extends cdk.StackProps {
  /**
   * Optional: Chaim API credentials secret name in Secrets Manager.
   * If not provided, uses direct credentials from environment variables.
   */
  chaimSecretName?: string;
}

export class SingleTableExampleStack extends cdk.Stack {
  /** The single DynamoDB table containing all entity types */
  public readonly singleTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: SingleTableExampleStackProps) {
    super(scope, id, props);

    // =====================================================
    // 1. Create Single Table for Multiple Entity Types
    // =====================================================
    // 
    // Single-table design pattern: one table, multiple entity types
    // differentiated by partition key prefix or sort key patterns.
    //
    // Example data layout:
    //   PK: CUSTOMER#123    SK: PROFILE           → Customer entity
    //   PK: CUSTOMER#123    SK: ORDER#456         → Order entity
    //   PK: PRODUCT#789     SK: METADATA          → Product entity
    //   PK: ORDER#456       SK: ITEM#1            → OrderItem entity
    //
    this.singleTable = new dynamodb.Table(this, 'EcommerceSingleTable', {
      tableName: 'ecommerce-single-table-demo',
      partitionKey: { 
        name: 'PK', 
        type: dynamodb.AttributeType.STRING 
      },
      sortKey: { 
        name: 'SK', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo - use RETAIN in production
    });

    // =====================================================
    // 2. Create Shared TableBindingConfig
    // =====================================================
    //
    // CRITICAL: All entities in the same table MUST use the same:
    // - appId (defines which application owns the table)
    // - credentials (defines authentication/authorization)
    //
    // TableBindingConfig enforces this by allowing you to create
    // one config and share it across all entity bindings.
    //
    const tableConfig = new TableBindingConfig(
      'ecommerce-app',
      props?.chaimSecretName
        ? ChaimCredentials.fromSecretsManager(props.chaimSecretName)
        : ChaimCredentials.fromApiKeys(
            process.env.CHAIM_API_KEY || 'dev-key',
            process.env.CHAIM_API_SECRET || 'dev-secret'
          )
    );

    // =====================================================
    // 3. Bind Multiple Entities with Shared Config
    // =====================================================
    //
    // Each entity gets its own ChaimDynamoDBBinder, but they all
    // share the same TableBindingConfig to ensure consistency.
    //
    // This creates:
    // - 4 separate snapshots (one per entity)
    // - 4 separate resourceIds: {table}__Customer, {table}__Product, etc.
    // - 4 separate CloudFormation custom resources
    // - All with the same appId and credentials
    //
    const entities = [
      { id: 'CustomerBinding', schema: 'customer.bprint' },
      { id: 'ProductBinding', schema: 'single-table-product.bprint' },
      { id: 'OrderBinding', schema: 'orders.bprint' },
      { id: 'OrderItemBinding', schema: 'order-item.bprint' },
    ];

    entities.forEach(({ id, schema }) => {
      new ChaimDynamoDBBinder(this as any, id, {
        schemaPath: path.join(__dirname, `../schemas/${schema}`),
        table: this.singleTable as any,
        config: tableConfig as any, // All share the same config!
      });
    });

    // =====================================================
    // 4. Stack Outputs
    // =====================================================
    new cdk.CfnOutput(this, 'TableName', {
      value: this.singleTable.tableName,
      description: 'Single table containing all entity types',
      exportName: `${this.stackName}-TableName`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.singleTable.tableArn,
      description: 'DynamoDB table ARN',
      exportName: `${this.stackName}-TableArn`,
    });

    new cdk.CfnOutput(this, 'EntityCount', {
      value: String(entities.length),
      description: 'Number of entities bound to this table',
    });

    // Helpful: Show where LOCAL snapshots will be written
    new cdk.CfnOutput(this, 'SnapshotHint', {
      value: `~/.chaim/cache/snapshots/aws/{accountId}/{region}/${this.stackName}/dynamodb/`,
      description: 'LOCAL snapshot location for chaim-cli code generation',
    });
  }
}

// =====================================================
// App Entry Point (for standalone usage)
// =====================================================
const app = new cdk.App();

new SingleTableExampleStack(app, 'SingleTableExampleStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Chaim Example: Single-table design with multiple entities',
});

app.synth();
