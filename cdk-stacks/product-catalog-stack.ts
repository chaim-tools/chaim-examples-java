#!/usr/bin/env node
/**
 * Product Catalog Infrastructure Stack
 * 
 * This stack demonstrates the complete Chaim workflow:
 * 1. Creates a DynamoDB table with composite key (partitionKey + sortKey)
 * 2. Binds the .bprint schema using ChaimDynamoDBBinder L2 construct
 * 3. During `cdk synth`, writes LOCAL snapshot to OS cache (~/.chaim/cache/snapshots/)
 * 4. The snapshot enables `chaim generate` to create type-safe Java SDK
 * 
 * Usage:
 *   # Synthesize (creates LOCAL snapshot for code generation)
 *   npx cdk synth ProductCatalogStack
 * 
 *   # Generate Java SDK from LOCAL snapshot
 *   npx chaim generate --stack ProductCatalogStack --package com.acme.products --output ./generated-sdks
 * 
 *   # Deploy to AWS (optional - can generate code before deploy)
 *   npx cdk deploy ProductCatalogStack
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

export interface ProductCatalogStackProps extends cdk.StackProps {
  /**
   * Optional: Chaim API credentials secret name in Secrets Manager.
   * If not provided, uses direct credentials from environment variables.
   * 
   * For production: Store credentials in AWS Secrets Manager
   * For development: Can use CHAIM_API_KEY and CHAIM_API_SECRET env vars
   */
  chaimSecretName?: string;
}

export class ProductCatalogStack extends cdk.Stack {
  /** The DynamoDB table for products */
  public readonly productTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: ProductCatalogStackProps) {
    super(scope, id, props);

    // =====================================================
    // 1. Create DynamoDB Table with Composite Key
    // =====================================================
    // 
    // The table schema MUST match the .bprint primaryKey definition:
    // - partitionKey: "productId" (String)
    // - sortKey: "category" (String)
    //
    // This allows efficient queries like:
    // - Get specific product: pk=productId, sk=category
    // - List all products in category: pk=productId, begins_with(sk, "category-prefix")
    //
    this.productTable = new dynamodb.Table(this, 'ProductTable', {
      tableName: 'acme-product-catalog',
      partitionKey: { 
        name: 'productId', 
        type: dynamodb.AttributeType.STRING 
      },
      sortKey: { 
        name: 'category', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo - use RETAIN in production
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // =====================================================
    // 2. Bind Schema with ChaimDynamoDBBinder
    // =====================================================
    //
    // The ChaimDynamoDBBinder L2 construct:
    // - Validates the .bprint schema
    // - Extracts DynamoDB table metadata (keys, indexes, etc.)
    // - Writes LOCAL snapshot to ~/.chaim/cache/snapshots/ during synth
    // - Creates Lambda-backed custom resource for SaaS ingestion (on deploy)
    //
    // IMPORTANT: The LOCAL snapshot is written during `cdk synth`,
    // which means you can generate code WITHOUT deploying first!
    //
    const schemaPath = path.join(__dirname, '../schemas/product-catalog.bprint');

    // Create binding configuration
    // - Determines credentials strategy (Secrets Manager vs direct API keys)
    // - For single-table design with multiple entities, create once and share
    const bindingConfig = new TableBindingConfig(
      'chaim-examples-java',
      props?.chaimSecretName
        ? ChaimCredentials.fromSecretsManager(props.chaimSecretName)
        : ChaimCredentials.fromApiKeys(
            process.env.CHAIM_API_KEY || 'demo-api-key',
            process.env.CHAIM_API_SECRET || 'demo-api-secret'
          )
    );

    new ChaimDynamoDBBinder(this as any, 'ProductSchema', {
      schemaPath,
      table: this.productTable as any,
      config: bindingConfig,
    });

    // =====================================================
    // 3. Stack Outputs
    // =====================================================
    // 
    // These outputs help with debugging and integration:
    //
    new cdk.CfnOutput(this, 'TableName', {
      value: this.productTable.tableName,
      description: 'DynamoDB table name for products',
      exportName: `${this.stackName}-TableName`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.productTable.tableArn,
      description: 'DynamoDB table ARN for products',
      exportName: `${this.stackName}-TableArn`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where resources are deployed',
      exportName: `${this.stackName}-Region`,
    });

    // Helpful: Show where LOCAL snapshot will be written
    new cdk.CfnOutput(this, 'SnapshotHint', {
      value: `~/.chaim/cache/snapshots/aws/{accountId}/{region}/${this.stackName}/dynamodb/`,
      description: 'LOCAL snapshot location for chaim-cli code generation',
    });
  }
}

// =====================================================
// App Entry Point
// =====================================================
//
// This file can be used directly: `npx cdk -a "npx ts-node cdk-stacks/product-catalog-stack.ts" synth`
// Or via cdk.json: `npx cdk synth ProductCatalogStack`
//
const app = new cdk.App();

new ProductCatalogStack(app, 'ProductCatalogStack', {
  env: {
    // Use CDK default account/region from AWS CLI config
    // Override with --profile or CDK_DEFAULT_ACCOUNT / CDK_DEFAULT_REGION
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Chaim Example: Product Catalog with DynamoDB + Generated Java SDK',
});

app.synth();
