#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OrdersInfrastructureStack } from './orders-infrastructure-stack';
import { OrdersApplicationStack } from './orders-application-stack';

const app = new cdk.App();

// Deploy infrastructure stack first
const infrastructureStack = new OrdersInfrastructureStack(app, 'OrdersInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Infrastructure stack for Orders example - DynamoDB, API Gateway, IAM roles'
});

// Deploy application stack that depends on infrastructure
new OrdersApplicationStack(app, 'OrdersApplicationStack', {
  infrastructureStackName: 'OrdersInfrastructureStack',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Application stack for Orders example - Lambda function with business logic'
});

app.synth();
