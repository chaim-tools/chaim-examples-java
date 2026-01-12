#!/usr/bin/env node
/**
 * Chaim Examples Java - CDK Application Entry Point
 * 
 * This file registers all CDK stacks for the chaim-examples-java project.
 * 
 * Available Stacks:
 * - ProductCatalogStack: Complete Chaim workflow demo (recommended starting point)
 * 
 * Usage:
 *   # List all stacks
 *   npx cdk list
 * 
 *   # Synthesize (creates LOCAL snapshots for code generation)
 *   npx cdk synth ProductCatalogStack
 * 
 *   # Deploy to AWS
 *   npx cdk deploy ProductCatalogStack
 */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

// Import stack definitions
import { ProductCatalogStack } from './product-catalog-stack';

const app = new cdk.App();

// =====================================================
// ProductCatalogStack - Primary Example (Recommended)
// =====================================================
// 
// Complete Chaim workflow demonstration:
// - DynamoDB table with composite key (PK + SK)
// - ChaimDynamoDBBinder L2 construct
// - LOCAL snapshot written to ~/.chaim/cache/snapshots/
// - Generates Java SDK with Repository pattern
//
new ProductCatalogStack(app, 'ProductCatalogStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Chaim Example: Product Catalog with DynamoDB + Generated Java SDK',
  // Optional: Use Secrets Manager for production deployments
  // chaimSecretName: 'chaim/api-credentials',
});

app.synth();
