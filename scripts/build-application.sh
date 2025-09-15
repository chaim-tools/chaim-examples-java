#!/bin/bash

# Build application script for Chaim examples
# This script builds the Java application with the generated SDK

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building Java Application${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}�� Checking prerequisites...${NC}"

if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ Maven not found. Please install Maven${NC}"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found. Please install Java 11+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check if generated SDK exists
echo -e "${YELLOW}🔍 Checking if generated SDK exists...${NC}"
SDK_PATH="generated-sdks/ordersstack-sdk/target/ordersstack-sdk-1.0.0.jar"
if [ ! -f "${SDK_PATH}" ]; then
    echo -e "${RED}❌ Generated SDK not found: ${SDK_PATH}${NC}"
    echo -e "${YELLOW}Please generate SDK first: ./scripts/generate-sdk.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Generated SDK found${NC}"

# Change to project root
cd "$(dirname "$0")/.."

# Build the application
echo -e "${YELLOW}🔨 Building Java application...${NC}"
cd java-applications/orders-app

mvn clean package -DskipTests

echo -e "${GREEN}✅ Application build completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Deploy application: ./scripts/deploy-application.sh${NC}"
echo -e "${BLUE}2. Test the API: ./scripts/test-api.sh${NC}"
```

