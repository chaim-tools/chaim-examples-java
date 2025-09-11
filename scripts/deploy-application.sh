#!/bin/bash

# Deploy application script for Chaim examples
# This script deploys the application stack (Lambda function with business logic)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INFRASTRUCTURE_STACK_NAME=${1:-"OrdersInfrastructureStack"}
APPLICATION_STACK_NAME=${2:-"OrdersApplicationStack"}
ENVIRONMENT=${3:-"dev"}

echo -e "${BLUE}🚀 Deploying Application Stack${NC}"
echo -e "${BLUE}Infrastructure Stack: ${INFRASTRUCTURE_STACK_NAME}${NC}"
echo -e "${BLUE}Application Stack: ${APPLICATION_STACK_NAME}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}�� Checking prerequisites...${NC}"

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

# Check if infrastructure stack exists
echo -e "${YELLOW}🔍 Checking if infrastructure stack exists...${NC}"
if ! aws cloudformation describe-stacks --stack-name ${INFRASTRUCTURE_STACK_NAME} &> /dev/null; then
    echo -e "${RED}❌ Infrastructure stack '${INFRASTRUCTURE_STACK_NAME}' not found.${NC}"
    echo -e "${YELLOW}Please deploy infrastructure first: ./scripts/deploy-infrastructure.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure stack found${NC}"

# Check if application JAR exists
echo -e "${YELLOW}🔍 Checking if application JAR exists...${NC}"
JAR_PATH="java-applications/orders-app/target/orders-app-1.0.0.jar"
if [ ! -f "${JAR_PATH}" ]; then
    echo -e "${RED}❌ Application JAR not found: ${JAR_PATH}${NC}"
    echo -e "${YELLOW}Please build application first: ./scripts/build-application.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application JAR found${NC}"

# Change to project root
cd "$(dirname "$0")/.."

# Deploy the application stack
echo -e "${YELLOW}🚀 Deploying application stack...${NC}"
cdk deploy ${APPLICATION_STACK_NAME} --require-approval never

echo -e "${GREEN}✅ Application deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}�� Next steps:${NC}"
echo -e "${BLUE}1. Test the API: ./scripts/test-api.sh${NC}"
echo -e "${BLUE}2. Run end-to-end tests: ./scripts/test-end-to-end.sh${NC}"
echo ""
echo -e "${BLUE}�� Useful commands:${NC}"
echo -e "${BLUE}  View stack outputs: aws cloudformation describe-stacks --stack-name ${APPLICATION_STACK_NAME}${NC}"
echo -e "${BLUE}  Destroy stack: cdk destroy ${APPLICATION_STACK_NAME}${NC}"
```

