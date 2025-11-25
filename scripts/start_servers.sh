#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting servers..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install npm first.${NC}"
    exit 1
fi

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

# Check and install frontend dependencies
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Frontend dependencies not found. Installing...${NC}"
    cd "$FRONTEND_DIR"
    npm install
    cd "$PROJECT_ROOT"
else
    echo -e "${GREEN}Frontend dependencies already installed.${NC}"
fi

# Check and install backend dependencies
if ! python3 -c "import fastapi" &> /dev/null || ! python3 -c "import uvicorn" &> /dev/null; then
    echo -e "${YELLOW}Backend dependencies not found. Installing...${NC}"
    cd "$BACKEND_DIR"
    pip3 install -r requirements.txt
    cd "$PROJECT_ROOT"
else
    echo -e "${GREEN}Backend dependencies already installed.${NC}"
fi

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Check if frontend is already running
if check_port 3000; then
    echo -e "${YELLOW}Frontend server is already running on port 3000. Skipping...${NC}"
    FRONTEND_PID=""
else
    echo -e "${GREEN}Starting frontend server...${NC}"
    cd "$FRONTEND_DIR"
    npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}Frontend server started (PID: $FRONTEND_PID)${NC}"
fi

# Check if backend is already running
if check_port 8000; then
    echo -e "${YELLOW}Backend server is already running on port 8000. Skipping...${NC}"
    BACKEND_PID=""
else
    echo -e "${GREEN}Starting backend server...${NC}"
    cd "$BACKEND_DIR"
    python3 -m uvicorn main:app --reload > /dev/null 2>&1 &
    BACKEND_PID=$!
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}Backend server started (PID: $BACKEND_PID)${NC}"
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}Frontend server stopped${NC}"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}Backend server stopped${NC}"
    fi
    exit 0
}

# Set up trap to catch Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Servers are running!${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend: http://localhost:8000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for both processes
if [ ! -z "$FRONTEND_PID" ] && [ ! -z "$BACKEND_PID" ]; then
    wait $FRONTEND_PID $BACKEND_PID
elif [ ! -z "$FRONTEND_PID" ]; then
    wait $FRONTEND_PID
elif [ ! -z "$BACKEND_PID" ]; then
    wait $BACKEND_PID
else
    # Both servers were already running, just wait indefinitely
    while true; do
        sleep 1
    done
fi

