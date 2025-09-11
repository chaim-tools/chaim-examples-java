#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ChaimBinder } from '../../chaim-cdk/src/chaim-binder';
import * as path from 'path';

export class OrdersStack extends cdk.Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly orderTable: dynamodb.Table;

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

    // Create Lambda functions for CRUD operations
    this.createLambdaFunctions();

    // Create API Gateway resources and methods
    this.createApiResources();

    // Load the orders schema
    const ordersSchema = path.join(__dirname, '../schemas/orders.bprint');

    // OSS Mode: No API credentials required
    // This will create CloudFormation outputs that chaim-cli can consume
    // Note: Temporarily commented out to fix table validation issue
    // const chaimBinder = new ChaimBinder(this, 'OrderSchemaOSS', {
    //   schemaPath: ordersSchema,
    //   table: this.orderTable,
    //   // No API credentials - works out of the box!
    //   // Creates outputs that chaim-cli can consume
    // });

    // Create manual CloudFormation outputs for now
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
  }

  private createLambdaFunctions(): void {
    // Common Lambda configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      environment: {
        TABLE_NAME: this.orderTable.tableName,
        TABLE_REGION: this.region,
      },
    };

    // Create Order Lambda function
    const orderLambda = new lambda.Function(this, 'OrderLambda', {
      ...lambdaConfig,
      code: lambda.Code.fromInline(this.getOrderLambdaCode()),
      functionName: 'orders-crud-handler',
    });

    // Grant DynamoDB permissions to Lambda
    this.orderTable.grantReadWriteData(orderLambda);

    // Store Lambda reference for API Gateway
    (this as any).orderLambda = orderLambda;
  }

  private createApiResources(): void {
    const orderLambda = (this as any).orderLambda;

    // Create /orders resource
    const ordersResource = this.apiGateway.root.addResource('orders');
    
    // GET /orders - List all orders
    ordersResource.addMethod('GET', new apigateway.LambdaIntegration(orderLambda, {
      requestTemplates: { 'application/json': JSON.stringify({ action: 'list' }) }
    }));

    // POST /orders - Create new order
    ordersResource.addMethod('POST', new apigateway.LambdaIntegration(orderLambda, {
      requestTemplates: { 'application/json': JSON.stringify({ action: 'create' }) }
    }));

    // Create /orders/{orderId} resource
    const orderResource = ordersResource.addResource('{orderId}');
    
    // GET /orders/{orderId} - Get specific order
    orderResource.addMethod('GET', new apigateway.LambdaIntegration(orderLambda, {
      requestTemplates: { 'application/json': JSON.stringify({ action: 'get' }) }
    }));

    // PUT /orders/{orderId} - Update order
    orderResource.addMethod('PUT', new apigateway.LambdaIntegration(orderLambda, {
      requestTemplates: { 'application/json': JSON.stringify({ action: 'update' }) }
    }));

    // DELETE /orders/{orderId} - Delete order
    orderResource.addMethod('DELETE', new apigateway.LambdaIntegration(orderLambda, {
      requestTemplates: { 'application/json': JSON.stringify({ action: 'delete' }) }
    }));

    // Create CloudFormation output for API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.url,
      description: 'API Gateway URL for Orders API',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });
  }

  private getOrderLambdaCode(): string {
    return `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const action = event.requestContext?.http?.method || event.action;
    const orderId = event.pathParameters?.orderId;
    const body = event.body ? JSON.parse(event.body) : {};
    
    try {
        switch (action) {
            case 'GET':
                if (orderId) {
                    return await getOrder(orderId);
                } else {
                    return await listOrders();
                }
            case 'POST':
                return await createOrder(body);
            case 'PUT':
                return await updateOrder(orderId, body);
            case 'DELETE':
                return await deleteOrder(orderId);
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function getOrder(orderId) {
    const params = {
        TableName: process.env.TABLE_NAME,
        Key: { orderId }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Order not found' })
        };
    }
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result.Item)
    };
}

async function listOrders() {
    const params = {
        TableName: process.env.TABLE_NAME
    };
    
    const result = await dynamodb.scan(params).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result.Items || [])
    };
}

async function createOrder(orderData) {
    const orderId = orderData.orderId || 'ORD-' + Date.now();
    const order = {
        orderId,
        customerId: orderData.customerId,
        amount: orderData.amount,
        currency: orderData.currency || 'USD',
        createdAt: new Date().toISOString()
    };
    
    const params = {
        TableName: process.env.TABLE_NAME,
        Item: order,
        ConditionExpression: 'attribute_not_exists(orderId)'
    };
    
    await dynamodb.put(params).promise();
    
    return {
        statusCode: 201,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(order)
    };
}

async function updateOrder(orderId, updateData) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updateData).forEach(key => {
        if (key !== 'orderId') {
            updateExpression.push(\`#\${key} = :\${key}\`);
            expressionAttributeNames[\`#\${key}\`] = key;
            expressionAttributeValues[\`:\${key}\`] = updateData[key];
        }
    });
    
    if (updateExpression.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No fields to update' })
        };
    }
    
    const params = {
        TableName: process.env.TABLE_NAME,
        Key: { orderId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result.Attributes)
    };
}

async function deleteOrder(orderId) {
    const params = {
        TableName: process.env.TABLE_NAME,
        Key: { orderId },
        ReturnValues: 'ALL_OLD'
    };
    
    const result = await dynamodb.delete(params).promise();
    
    if (!result.Attributes) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Order not found' })
        };
    }
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Order deleted successfully', order: result.Attributes })
    };
}
`;
  }
}

const app = new cdk.App();
new OrdersStack(app, 'OrdersStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Orders example stack using ChaimBinder'
});

app.synth();
