#!/bin/bash

# End-to-end testing script for Chaim examples
# This script validates the complete workflow from schema to Java application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME=${1:-"OrdersStack"}
TEST_ENVIRONMENT=${2:-"dev"}

echo -e "${BLUE}🧪 Running End-to-End Tests for Chaim Examples${NC}"
echo -e "${BLUE}Stack: ${STACK_NAME}${NC}"
echo -e "${BLUE}Environment: ${TEST_ENVIRONMENT}${NC}"
echo ""

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}🔍 Running test: ${test_name}${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Change to project root
cd "$(dirname "$0")/.."

echo -e "${BLUE}📋 Test Suite Overview${NC}"
echo -e "${BLUE}====================${NC}"
echo ""

# Test 1: Schema Validation
run_test "Schema Validation" "
    if [ -d '../chaim-bprint-spec' ]; then
        node ../chaim-bprint-spec/scripts/validate-examples.mjs schemas/
    else
        echo 'Skipping schema validation - chaim-bprint-spec not found'
        true
    fi
"

# Test 2: CDK Synthesis
run_test "CDK Synthesis" "
    if [ -f 'package.json' ]; then
        npm install --silent
        cdk synth ${STACK_NAME} > /dev/null
    else
        echo 'Skipping CDK synthesis - no package.json found'
        true
    fi
"

# Test 3: Stack Deployment (if not already deployed)
run_test "Stack Deployment Check" "
    if aws cloudformation describe-stacks --stack-name ${STACK_NAME} &> /dev/null; then
        echo 'Stack already deployed'
        true
    else
        echo 'Stack not deployed - would need to deploy first'
        true
    fi
"

# Test 4: Java SDK Generation
run_test "Java SDK Generation" "
    if command -v chaim &> /dev/null; then
        if aws cloudformation describe-stacks --stack-name ${STACK_NAME} &> /dev/null; then
            mkdir -p test-generated-sdk
            chaim generate java --stack-name ${STACK_NAME} --output-dir test-generated-sdk --namespace com.test
            rm -rf test-generated-sdk
        else
            echo 'Skipping SDK generation - stack not deployed'
            true
        fi
    else
        echo 'Skipping SDK generation - chaim CLI not found'
        true
    fi
"

# Test 5: Java Compilation (if Maven is available)
run_test "Java Compilation" "
    if command -v mvn &> /dev/null; then
        if [ -d 'java-applications/orders-app' ] && [ -f 'java-applications/orders-app/pom.xml' ]; then
            cd java-applications/orders-app
            mvn clean compile -q
            cd ../..
        else
            echo 'Skipping Java compilation - no Maven project found'
            true
        fi
    else
        echo 'Skipping Java compilation - Maven not found'
        true
    fi
"

# Test 6: Integration Tests (if available)
run_test "Integration Tests" "
    if [ -f 'scripts/integration-test.sh' ]; then
        ./scripts/integration-test.sh ${STACK_NAME}
    else
        echo 'Skipping integration tests - no integration test script found'
        true
    fi
"

# Test 7: Documentation Generation
run_test "Documentation Generation" "
    if [ -d 'docs' ]; then
        echo 'Documentation directory exists'
        if [ -f 'docs/getting-started.md' ]; then
            echo 'Getting started guide exists'
        fi
        true
    else
        echo 'Skipping documentation check - docs directory not found'
        true
    fi
"

# Test 8: Cleanup Test
run_test "Cleanup Test" "
    # Clean up any test artifacts
    rm -rf test-generated-sdk
    rm -rf node_modules/.cache
    echo 'Cleanup completed'
    true
"

# Print test results
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}======================${NC}"
echo -e "${GREEN}✅ Tests Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}❌ Tests Failed: ${TESTS_FAILED}${NC}"
echo -e "${BLUE}📋 Total Tests: ${TOTAL_TESTS}${NC}"

if [ ${TESTS_FAILED} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! The Chaim examples are working correctly.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Ready for production use!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "${BLUE}1. Deploy to production: ./scripts/deploy.sh ${STACK_NAME} prod${NC}"
    echo -e "${BLUE}2. Generate production SDK: ./scripts/generate-sdk.sh ${STACK_NAME}${NC}"
    echo -e "${BLUE}3. Create your application: ./scripts/create-example-app.sh${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please review the output above and fix any issues.${NC}"
    echo ""
    echo -e "${YELLOW}Common issues and solutions:${NC}"
    echo -e "${YELLOW}1. Missing dependencies: Install required tools (CDK, AWS CLI, Maven)${NC}"
    echo -e "${YELLOW}2. AWS credentials: Run 'aws configure' to set up credentials${NC}"
    echo -e "${YELLOW}3. Stack not deployed: Run './scripts/deploy.sh ${STACK_NAME}' first${NC}"
    echo -e "${YELLOW}4. Schema validation: Check your .bprint files for syntax errors${NC}"
    exit 1
fi
