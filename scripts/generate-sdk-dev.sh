#!/bin/bash

# Generate Java SDK script for LOCAL DEVELOPMENT
# This script uses the local chaim-cli build for development/testing
# Following industry best practices from Create React App, Next.js, Vue CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME=${1:-"OrdersInfrastructureStack"}
OUTPUT_DIR=${2:-"generated-sdks"}
NAMESPACE=${3:-"com.example"}

# CLI path - use local build
CHAIN_CLI_PATH="../chaim-cli/cli/dist/index.js"

echo -e "${BLUE}🔧 [DEV] Generating Java SDK from Infrastructure Stack${NC}"
echo -e "${BLUE}Stack: ${STACK_NAME}${NC}"
echo -e "${BLUE}Output Directory: ${OUTPUT_DIR}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo -e "${YELLOW}⚠️  Using LOCAL chaim-cli build (development mode)${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if [ ! -f "${CHAIN_CLI_PATH}" ]; then
    echo -e "${RED}❌ Local Chaim CLI not found at ${CHAIN_CLI_PATH}${NC}"
    echo -e "${YELLOW}Please build the CLI first: cd ../chaim-cli && npm run build${NC}"
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

# Check if stack exists
echo -e "${YELLOW}🔍 Checking if stack exists...${NC}"
if ! aws cloudformation describe-stacks --stack-name ${STACK_NAME} &> /dev/null; then
    echo -e "${RED}❌ Stack '${STACK_NAME}' not found. Please deploy the stack first.${NC}"
    echo -e "${YELLOW}Run: ./scripts/deploy-infrastructure.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Stack found${NC}"

# Create output directory
echo -e "${YELLOW}📁 Creating output directory...${NC}"
mkdir -p ${OUTPUT_DIR}

# Generate Java SDK using local CLI
echo -e "${YELLOW}🔧 Generating Java SDK using LOCAL CLI...${NC}"
cd "$(dirname "$0")/.."

node ${CHAIN_CLI_PATH} generate \
    --stack ${STACK_NAME} \
    --package ${NAMESPACE}.orders \
    --output ${OUTPUT_DIR}

echo -e "${GREEN}✅ Java SDK generated successfully using LOCAL CLI!${NC}"

# Create a simple Maven project structure
echo -e "${YELLOW}📦 Setting up Maven project structure...${NC}"

# Create pom.xml for the generated SDK
cat > ${OUTPUT_DIR}/pom.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>${NAMESPACE}</groupId>
    <artifactId>orders-sdk</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <name>Orders SDK</name>
    <description>Generated Java SDK for Orders management</description>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>dynamodb</artifactId>
            <version>2.20.0</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>dynamodb-enhanced</artifactId>
            <version>2.20.0</version>
        </dependency>
    </dependencies>
</project>
EOF

echo -e "${GREEN}✅ Maven project structure created${NC}"
echo ""
echo -e "${BLUE}🎯 Next steps:${NC}"
echo -e "1. Review generated SDK in: ${OUTPUT_DIR}/"
echo -e "2. Build with Maven: ${YELLOW}cd ${OUTPUT_DIR} && mvn clean compile${NC}"
echo -e "3. Use in your Java application"
echo ""
echo -e "${YELLOW}💡 This was generated using LOCAL chaim-cli build (development mode)${NC}"
echo -e "${BLUE}For production, use: ${YELLOW}npm run generate-sdk${NC}"
