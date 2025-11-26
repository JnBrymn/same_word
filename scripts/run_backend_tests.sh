#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running backend tests...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 is not installed. Please install pip3 first.${NC}"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

# Check if pytest is installed, if not install dependencies
if ! python3 -c "import pytest" &> /dev/null; then
    echo -e "${YELLOW}Backend dependencies not found. Installing...${NC}"
    cd "$BACKEND_DIR"
    pip3 install -r requirements.txt
    cd "$PROJECT_ROOT"
fi

# Run tests
echo -e "${GREEN}Running tests in $BACKEND_DIR${NC}"
cd "$BACKEND_DIR"
python3 -m pytest

# Capture exit code
TEST_EXIT_CODE=$?

cd "$PROJECT_ROOT"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Backend tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Backend tests failed!${NC}"
    exit $TEST_EXIT_CODE
fi

