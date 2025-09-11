#!/bin/bash

# Deploy script for Chaim examples
# This script demonstrates how to deploy infrastructure using ChaimBinder

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME=${1:-"OrdersStack"}
ENVIRONMENT=${2:-"dev"}
REGION=${3:-"us-east-1"}

echo -e "${BLUE}🚀 Deploying Chaim Examples Stack${NC}"
echo -e "${BLUE}Stack: ${STACK_NAME}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ CDK CLI not found. Please install AWS CDK CLI${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Validate schemas
echo -e "${YELLOW}🔍 Validating schemas...${NC}"
cd "$(dirname "$0")/.."

# Check if chaim-bprint-spec is available for validation
if [ -d "../chaim-bprint-spec" ]; then
    echo -e "${BLUE}Validating schemas using chaim-bprint-spec...${NC}"
    node ../chaim-bprint-spec/scripts/validate-examples.mjs schemas/
    echo -e "${GREEN}✅ Schema validation passed${NC}"
else
    echo -e "${YELLOW}⚠️  chaim-bprint-spec not found, skipping schema validation${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
else
    echo -e "${YELLOW}⚠️  No package.json found, creating one...${NC}"
    cat > package.json << EOF
{
  "name": "chaim-examples-java",
  "version": "1.0.0",
  "description": "Chaim examples demonstrating complete workflow",
  "scripts": {
    "deploy": "cdk deploy",
    "synth": "cdk synth",
    "destroy": "cdk destroy"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0",
    "chaim-cdk": "file:../chaim-cdk"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
    npm install
fi

# Bootstrap CDK if needed
echo -e "${YELLOW}🔧 Bootstrapping CDK...${NC}"
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/${REGION}

# Deploy the stack
echo -e "${YELLOW}🚀 Deploying stack...${NC}"
cdk deploy ${STACK_NAME} --require-approval never

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Generate Java SDK: ./scripts/generate-sdk.sh ${STACK_NAME}${NC}"
echo -e "${BLUE}2. Run end-to-end tests: ./scripts/test-end-to-end.sh${NC}"
echo ""
echo -e "${BLUE}🔗 Useful commands:${NC}"
echo -e "${BLUE}  View stack outputs: aws cloudformation describe-stacks --stack-name ${STACK_NAME}${NC}"
echo -e "${BLUE}  Destroy stack: cdk destroy ${STACK_NAME}${NC}"
