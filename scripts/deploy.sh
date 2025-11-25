#!/bin/bash

# Deployment script for fly.io
# This script handles deploying the same-word app to fly.io

set -e  # Exit on error

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# App name from fly.toml
APP_NAME="same-word"

echo -e "${BLUE}🚀 Deploying $APP_NAME to fly.io${NC}"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}Error: flyctl is not installed.${NC}"
    echo -e "${YELLOW}Please install flyctl first:${NC}"
    echo "  macOS: brew install flyctl"
    echo "  Linux: curl -L https://fly.io/install.sh | sh"
    echo "  Windows: https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

echo -e "${GREEN}✓ flyctl is installed${NC}"

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to fly.io${NC}"
    echo -e "${YELLOW}Please log in:${NC}"
    flyctl auth login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Login failed. Exiting.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Logged in to fly.io${NC}"

# Check if app exists
cd "$PROJECT_ROOT"
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo -e "${YELLOW}⚠ App '$APP_NAME' does not exist${NC}"
    read -p "Create the app now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Creating app '$APP_NAME'...${NC}"
        flyctl apps create "$APP_NAME" --region iad
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to create app. Exiting.${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ App created${NC}"
    else
        echo -e "${RED}App creation cancelled. Exiting.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ App '$APP_NAME' exists${NC}"
fi

# Check if fly.toml exists
if [ ! -f "$PROJECT_ROOT/fly.toml" ]; then
    echo -e "${RED}Error: fly.toml not found in project root${NC}"
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "$PROJECT_ROOT/Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found in project root${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration files found${NC}"
echo ""

# Deploy the app
echo -e "${BLUE}📦 Deploying to fly.io...${NC}"
echo ""

cd "$PROJECT_ROOT"
flyctl deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo ""

# Ask if user wants to open the app
read -p "Open the app in your browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Opening https://$APP_NAME.fly.dev...${NC}"
    flyctl open
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}Your app is available at: https://$APP_NAME.fly.dev${NC}"

