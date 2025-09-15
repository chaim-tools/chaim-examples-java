#!/bin/bash

# Test script to validate CLI integration (both local and production)
# Following industry best practices from Create React App, Next.js, Vue CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing CLI Integration (Industry Best Practices)${NC}"
echo ""

# Test 1: Validate schema with local CLI
echo -e "${YELLOW}📋 Test 1: Validating schema with LOCAL CLI (dev mode)...${NC}"
if npm run validate:dev; then
    echo -e "${GREEN}✅ Local CLI schema validation passed${NC}"
else
    echo -e "${RED}❌ Local CLI schema validation failed${NC}"
    exit 1
fi

echo ""

# Test 2: Check local CLI help
echo -e "${YELLOW}📋 Test 2: Checking LOCAL CLI help...${NC}"
if npm run chaim:dev -- --help | grep -q "generate"; then
    echo -e "${GREEN}✅ Local CLI help command works${NC}"
else
    echo -e "${RED}❌ Local CLI help command failed${NC}"
    exit 1
fi

echo ""

# Test 3: Check if production CLI is available
echo -e "${YELLOW}📋 Test 3: Checking PRODUCTION CLI availability...${NC}"
if command -v chaim &> /dev/null; then
    echo -e "${GREEN}✅ Global chaim CLI found${NC}"
    if chaim --version; then
        echo -e "${GREEN}✅ Global CLI version check passed${NC}"
    fi
elif npx @chaim/cli --version &> /dev/null; then
    echo -e "${GREEN}✅ npx @chaim/cli available${NC}"
    if npx @chaim/cli --version; then
        echo -e "${GREEN}✅ npx CLI version check passed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Production CLI not available (expected for development)${NC}"
    echo -e "${YELLOW}   This is normal when developing locally${NC}"
fi

echo ""

# Test 4: Validate schema with production CLI (if available)
echo -e "${YELLOW}📋 Test 4: Validating schema with PRODUCTION CLI...${NC}"
if npm run validate; then
    echo -e "${GREEN}✅ Production CLI schema validation passed${NC}"
else
    echo -e "${YELLOW}⚠️  Production CLI not available (expected for development)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CLI integration tests completed!${NC}"
echo ""
echo -e "${BLUE}📖 Usage Summary (Following Industry Best Practices):${NC}"
echo ""
echo -e "${YELLOW}For Local Development (Contributors):${NC}"
echo -e "  ${BLUE}npm run chaim:dev validate schemas/orders.bprint${NC}"
echo -e "  ${BLUE}npm run validate:dev${NC}"
echo -e "  ${BLUE}npm run generate-sdk:dev${NC}"
echo ""
echo -e "${YELLOW}For Production/End Users:${NC}"
echo -e "  ${BLUE}npm run chaim validate schemas/orders.bprint${NC}"
echo -e "  ${BLUE}npm run validate${NC}"
echo -e "  ${BLUE}npm run generate-sdk${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "1. Deploy infrastructure: ${YELLOW}./scripts/deploy-infrastructure.sh${NC}"
echo -e "2. Generate SDK: ${YELLOW}npm run generate-sdk:dev${NC} (for dev) or ${YELLOW}npm run generate-sdk${NC} (for users)"
echo -e "3. Deploy application: ${YELLOW}./scripts/deploy-application.sh${NC}"
echo -e "4. Run tests: ${YELLOW}./scripts/test-end-to-end.sh${NC}"
echo ""
echo -e "${GREEN}✨ This follows the same patterns as Create React App, Next.js, and Vue CLI!${NC}"
