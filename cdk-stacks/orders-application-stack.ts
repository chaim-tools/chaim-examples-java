#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface OrdersApplicationStackProps extends cdk.StackProps {
  infrastructureStackName: string;
}

export class OrdersApplicationStack extends cdk.Stack {
  public readonly orderLambda: lambda.Function;

  constructor(scope: cdk.App, id: string, props: OrdersApplicationStackProps) {
    super(scope, id, props);

    // Import infrastructure resources
    const tableName = cdk.Fn.importValue(`${props.infrastructureStackName}-TableName`);
    const tableArn = cdk.Fn.importValue(`${props.infrastructureStackName}-TableArn`);
    const apiGatewayId = cdk.Fn.importValue(`${props.infrastructureStackName}-ApiGatewayId`);
    const lambdaExecutionRoleArn = cdk.Fn.importValue(`${props.infrastructureStackName}-LambdaExecutionRoleArn`);
    const region = cdk.Fn.importValue(`${props.infrastructureStackName}-Region`);

    // Create Lambda function with application code
    this.orderLambda = new lambda.Function(this, 'OrderLambda', {
      runtime: lambda.Runtime.JAVA_11,
      handler: 'com.example.orders.OrdersHandler::handleRequest',
      code: lambda.Code.fromAsset(path.join(__dirname, '../java-applications/orders-app/target/orders-app-1.0.0.jar')),
      role: iam.Role.fromRoleArn(this, 'LambdaExecutionRole', lambdaExecutionRoleArn),
      environment: {
        TABLE_NAME: tableName,
        TABLE_ARN: tableArn,
        REGION: region,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // For now, we'll just create the Lambda function
    // API Gateway integration can be added later or done manually
    // The Lambda function can be invoked directly for testing

    // Output Lambda function ARN for reference
    new cdk.CfnOutput(this, 'OrderLambdaArn', {
      value: this.orderLambda.functionArn,
      description: 'Lambda function ARN for orders',
    });
  }
}

const app = new cdk.App();
new OrdersApplicationStack(app, 'OrdersApplicationStack', {
  infrastructureStackName: 'OrdersInfrastructureStack',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Application stack for Orders example - Lambda function with business logic'
});

app.synth();
