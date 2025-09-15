#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ChaimBinder } from 'chaim-cdk';
import * as path from 'path';

export class OrdersInfrastructureStack extends cdk.Stack {
  public readonly orderTable: dynamodb.Table;
  public readonly apiGateway: apigateway.RestApi;
  public readonly lambdaExecutionRole: iam.Role;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for orders
    this.orderTable = new dynamodb.Table(this, 'OrderTable', {
      tableName: 'orders',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // Create API Gateway
    this.apiGateway = new apigateway.RestApi(this, 'OrdersApi', {
      restApiName: 'Orders Management API',
      description: 'API for managing orders with CRUD operations',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Create IAM role for Lambda functions
    this.lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions to Lambda role
    this.orderTable.grantReadWriteData(this.lambdaExecutionRole);

    // Load the orders schema for metadata
    const ordersSchema = path.join(__dirname, '../schemas/orders.bprint');
    
    // For now, we'll create outputs manually instead of using ChaimBinder
    // This avoids the table validation timing issue during construction
    // TODO: Fix ChaimBinder to handle table metadata extraction properly

    // Export values for application stack to use
    new cdk.CfnOutput(this, 'TableName', {
      value: this.orderTable.tableName,
      description: 'DynamoDB table name for orders',
      exportName: `${this.stackName}-TableName`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.orderTable.tableArn,
      description: 'DynamoDB table ARN for orders',
      exportName: `${this.stackName}-TableArn`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.url,
      description: 'API Gateway URL for Orders API',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.apiGateway.restApiId,
      description: 'API Gateway ID for Orders API',
      exportName: `${this.stackName}-ApiGatewayId`,
    });

    new cdk.CfnOutput(this, 'LambdaExecutionRoleArn', {
      value: this.lambdaExecutionRole.roleArn,
      description: 'IAM role ARN for Lambda execution',
      exportName: `${this.stackName}-LambdaExecutionRoleArn`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region',
      exportName: `${this.stackName}-Region`,
    });

    // Schema metadata outputs for chaim-cli consumption
    new cdk.CfnOutput(this, 'SchemaPath', {
      value: ordersSchema,
      description: 'Path to the orders schema file',
      exportName: `${this.stackName}-SchemaPath`,
    });

    new cdk.CfnOutput(this, 'SchemaNamespace', {
      value: 'acme.orders',
      description: 'Schema namespace for orders',
      exportName: `${this.stackName}-SchemaNamespace`,
    });
  }
}

const app = new cdk.App();
new OrdersInfrastructureStack(app, 'OrdersInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Infrastructure stack for Orders example - DynamoDB, API Gateway, IAM roles'
});

app.synth();
