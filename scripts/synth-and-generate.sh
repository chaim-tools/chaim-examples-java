#!/bin/bash

# ============================================================================
# synth-and-generate.sh - Complete Chaim Workflow Script
# ============================================================================
#
# This script demonstrates the complete Chaim workflow:
# 1. Synthesize CDK stack (creates LOCAL snapshot in OS cache)
# 2. Generate Java SDK from LOCAL snapshot using chaim-cli
# 3. Build the generated SDK with Maven
#
# Usage:
#   ./scripts/synth-and-generate.sh [STACK_NAME] [PACKAGE_NAME]
#
# Examples:
#   ./scripts/synth-and-generate.sh ProductCatalogStack com.acme.products
#   ./scripts/synth-and-generate.sh                      # Uses defaults
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration (can be overridden via arguments)
STACK_NAME="${1:-ProductCatalogStack}"
PACKAGE_NAME="${2:-com.acme.products}"
OUTPUT_DIR="./generated-sdks/${STACK_NAME,,}-sdk"  # lowercase stack name

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              Chaim Tools - Complete Workflow Demo                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "   Stack:   ${STACK_NAME}"
echo -e "   Package: ${PACKAGE_NAME}"
echo -e "   Output:  ${OUTPUT_DIR}"
echo ""

# Change to script directory's parent (project root)
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"
echo ""

# ============================================================================
# Step 1: Prerequisites Check
# ============================================================================
echo -e "${YELLOW}━━━ Step 1: Checking Prerequisites ━━━${NC}"

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ $1 not found. Please install $1${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ $1${NC}"
    return 0
}

PREREQS_OK=true
check_command "node" || PREREQS_OK=false
check_command "npm" || PREREQS_OK=false
check_command "java" || PREREQS_OK=false
check_command "mvn" || PREREQS_OK=false

if [ "$PREREQS_OK" = false ]; then
    echo -e "${RED}❌ Prerequisites check failed. Please install missing tools.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
echo ""

# ============================================================================
# Step 2: Install Dependencies
# ============================================================================
echo -e "${YELLOW}━━━ Step 2: Installing Dependencies ━━━${NC}"

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "Node modules already installed"
fi
echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# ============================================================================
# Step 3: CDK Synth (Creates LOCAL Snapshot)
# ============================================================================
echo -e "${YELLOW}━━━ Step 3: Synthesizing CDK Stack ━━━${NC}"
echo "This writes the LOCAL snapshot to ~/.chaim/cache/snapshots/"
echo ""

npx cdk synth "${STACK_NAME}" --quiet 2>&1 | head -20

echo ""
echo -e "${GREEN}✓ CDK synthesis complete${NC}"
echo ""

# Show where snapshot was written
SNAPSHOT_DIR=~/.chaim/cache/snapshots/aws
if [ -d "$SNAPSHOT_DIR" ]; then
    echo -e "${BLUE}📍 Snapshot location:${NC}"
    find "$SNAPSHOT_DIR" -name "*.json" -type f 2>/dev/null | head -5 | while read -r f; do
        echo "   $f"
    done
    echo ""
fi

# ============================================================================
# Step 4: Generate Java SDK
# ============================================================================
echo -e "${YELLOW}━━━ Step 4: Generating Java SDK ━━━${NC}"
echo "Reading LOCAL snapshot and generating type-safe Java code..."
echo ""

# Use local chaim-cli (from sibling directory)
CHAIM_CLI="../chaim-cli/dist/index.js"

if [ -f "$CHAIM_CLI" ]; then
    echo "Using local chaim-cli"
    node "$CHAIM_CLI" generate \
        --stack "${STACK_NAME}" \
        --package "${PACKAGE_NAME}" \
        --output "${OUTPUT_DIR}"
else
    echo "Using installed chaim-cli (npx)"
    npx @chaim/cli generate \
        --stack "${STACK_NAME}" \
        --package "${PACKAGE_NAME}" \
        --output "${OUTPUT_DIR}"
fi

echo ""
echo -e "${GREEN}✓ Java SDK generated${NC}"
echo ""

# ============================================================================
# Step 5: Show Generated Files
# ============================================================================
echo -e "${YELLOW}━━━ Step 5: Generated Files ━━━${NC}"
echo ""

if [ -d "${OUTPUT_DIR}" ]; then
    echo -e "${BLUE}📦 Generated SDK structure:${NC}"
    find "${OUTPUT_DIR}" -type f -name "*.java" | head -20 | while read -r f; do
        echo "   ${f}"
    done
    echo ""
    
    # Count files
    JAVA_COUNT=$(find "${OUTPUT_DIR}" -name "*.java" -type f | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ Generated ${JAVA_COUNT} Java files${NC}"
else
    echo -e "${YELLOW}⚠️  No files generated. Check for errors above.${NC}"
fi
echo ""

# ============================================================================
# Step 6: Generate pom.xml for SDK
# ============================================================================
echo -e "${YELLOW}━━━ Step 6: Creating SDK pom.xml ━━━${NC}"

POM_PATH="${OUTPUT_DIR}/pom.xml"
TEMPLATE_PATH="./templates/sdk-pom.xml.template"

# Extract group ID from package name (everything except last part)
GROUP_ID=$(echo "$PACKAGE_NAME" | sed 's/\.[^.]*$//')
ARTIFACT_ID="${STACK_NAME,,}-sdk"  # lowercase

if [ -f "$TEMPLATE_PATH" ]; then
    echo "Generating pom.xml from template..."
    sed -e "s/{{GROUP_ID}}/${GROUP_ID}/g" \
        -e "s/{{ARTIFACT_ID}}/${ARTIFACT_ID}/g" \
        -e "s/{{PACKAGE_NAME}}/${PACKAGE_NAME}/g" \
        "$TEMPLATE_PATH" > "${OUTPUT_DIR}/pom.xml"
    echo -e "${GREEN}✓ Generated ${OUTPUT_DIR}/pom.xml${NC}"
else
    echo -e "${YELLOW}⚠️  Template not found at ${TEMPLATE_PATH}${NC}"
    echo "   Creating minimal pom.xml..."
    cat > "${OUTPUT_DIR}/pom.xml" << POMEOF
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>${GROUP_ID}</groupId>
    <artifactId>${ARTIFACT_ID}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <aws.sdk.version>2.28.0</aws.sdk.version>
        <lombok.version>1.18.30</lombok.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>dynamodb-enhanced</artifactId>
            <version>\${aws.sdk.version}</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>\${lombok.version}</version>
            <scope>provided</scope>
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
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>\${lombok.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
POMEOF
    echo -e "${GREEN}✓ Created minimal pom.xml${NC}"
fi
echo ""

# ============================================================================
# Step 7: Build SDK with Maven
# ============================================================================
echo -e "${YELLOW}━━━ Step 7: Building SDK with Maven ━━━${NC}"

if [ -f "${OUTPUT_DIR}/pom.xml" ]; then
    echo "Building SDK JAR..."
    cd "${OUTPUT_DIR}"
    mvn package -DskipTests -q 2>&1 || {
        echo -e "${YELLOW}⚠️  Maven build had issues - check output above${NC}"
    }
    cd "$PROJECT_ROOT"
    
    if [ -f "${OUTPUT_DIR}/target/${ARTIFACT_ID}-1.0.0.jar" ]; then
        echo -e "${GREEN}✓ SDK JAR built: ${OUTPUT_DIR}/target/${ARTIFACT_ID}-1.0.0.jar${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No pom.xml found${NC}"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                         ✅ Complete!                             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "   1. CDK stack synthesized → LOCAL snapshot created"
echo "   2. Java SDK generated in ${OUTPUT_DIR}"
echo "   3. SDK ready for use in your Java application"
echo ""
echo -e "${BLUE}📖 Next Steps:${NC}"
echo "   • Deploy to AWS:  npx cdk deploy ${STACK_NAME}"
echo "   • Use the SDK:    Add generated code to your Java project"
echo "   • Run the demo:   cd java-applications/product-demo && mvn exec:java"
echo ""
echo -e "${BLUE}📍 Key Locations:${NC}"
echo "   • Schema:   schemas/product-catalog.bprint"
echo "   • Stack:    cdk-stacks/product-catalog-stack.ts"
echo "   • SDK:      ${OUTPUT_DIR}/"
echo "   • Demo App: java-applications/product-demo/"
echo ""
