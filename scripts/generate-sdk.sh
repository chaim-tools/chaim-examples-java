#!/bin/bash

# Generate Java SDK script for PRODUCTION/USERS
# This script uses the published @chaim/cli package
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

echo -e "${BLUE}🔧 Generating Java SDK from Infrastructure Stack${NC}"
echo -e "${BLUE}Stack: ${STACK_NAME}${NC}"
echo -e "${BLUE}Output Directory: ${OUTPUT_DIR}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if chaim CLI is available (either globally or via npx)
if ! command -v chaim &> /dev/null && ! npx @chaim/cli --version &> /dev/null; then
    echo -e "${RED}❌ Chaim CLI not found. Please install it first:${NC}"
    echo -e "${YELLOW}  npm install -g @chaim/cli${NC}"
    echo -e "${YELLOW}  or use: npx @chaim/cli${NC}"
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
    echo -e "${YELLOW}Run: ./scripts/deploy.sh ${STACK_NAME}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Stack found${NC}"

# Create output directory
echo -e "${YELLOW}📁 Creating output directory...${NC}"
mkdir -p ${OUTPUT_DIR}

# Generate Java SDK using published CLI
echo -e "${YELLOW}🔧 Generating Java SDK using published CLI...${NC}"
cd "$(dirname "$0")/.."

# Use chaim if available globally, otherwise use npx
if command -v chaim &> /dev/null; then
    chaim generate \
        --stack ${STACK_NAME} \
        --package ${NAMESPACE}.orders \
        --output ${OUTPUT_DIR}
else
    npx @chaim/cli generate \
        --stack ${STACK_NAME} \
        --package ${NAMESPACE}.orders \
        --output ${OUTPUT_DIR}
fi

echo -e "${GREEN}✅ Java SDK generated successfully!${NC}"

# Create a simple Maven project structure
echo -e "${YELLOW}📦 Setting up Maven project structure...${NC}"
SDK_DIR="${OUTPUT_DIR}/ordersstack-sdk"

# Create pom.xml
cat > ${SDK_DIR}/pom.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>${NAMESPACE}</groupId>
    <artifactId>ordersstack-sdk</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <name>Orders Stack SDK</name>
    <description>Generated Java SDK for Orders Infrastructure Stack</description>
    
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
            <artifactId>lambda</artifactId>
            <version>2.20.0</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.15.0</version>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.9.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0</version>
            </plugin>
        </plugins>
    </build>
</project>
EOF

# Create src directory structure
mkdir -p ${SDK_DIR}/src/main/java
mkdir -p ${SDK_DIR}/src/test/java

echo -e "${GREEN}✅ Maven project structure created${NC}"

# Compile the SDK
echo -e "${YELLOW}🔨 Compiling Java SDK...${NC}"
cd ${SDK_DIR}
if command -v mvn &> /dev/null; then
    mvn clean compile
    echo -e "${GREEN}✅ Java SDK compiled successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Maven not found, skipping compilation${NC}"
    echo -e "${YELLOW}Install Maven to compile the SDK: https://maven.apache.org/install.html${NC}"
fi

cd "$(dirname "$0")/.."

echo ""
echo -e "${GREEN}🎉 Java SDK generation completed!${NC}"
echo ""
echo -e "${BLUE}📋 Generated files:${NC}"
echo -e "${BLUE}  SDK Location: ${SDK_DIR}${NC}"
echo -e "${BLUE}  Maven Project: ${SDK_DIR}/pom.xml${NC}"
echo ""
echo -e "${BLUE}🔗 Next steps:${NC}"
echo -e "${BLUE}1. Review generated code in ${SDK_DIR}/src/main/java${NC}"
echo -e "${BLUE}2. Run tests: cd ${SDK_DIR} && mvn test${NC}"
echo -e "${BLUE}3. Build JAR: cd ${SDK_DIR} && mvn package${NC}"
echo -e "${BLUE}4. Use in your application: ./scripts/create-example-app.sh${NC}"
