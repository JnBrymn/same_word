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

# Function to check if a port is actually serving HTTP
check_port_http() {
    local port=$1
    curl -s "http://localhost:$port" > /dev/null 2>&1 || curl -s "http://localhost:$port/ping" > /dev/null 2>&1
}

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing stale process on port $port (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Kill any stale processes on ports
kill_port 3000
kill_port 8000

# Start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"
cd "$FRONTEND_DIR"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"
echo -e "${GREEN}Frontend server starting (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}Frontend logs: /tmp/frontend.log${NC}"

# Wait a bit and verify frontend is actually running
sleep 3
if check_port_http 3000; then
    echo -e "${GREEN}Frontend server is running on http://localhost:3000${NC}"
else
    echo -e "${RED}Frontend server failed to start. Check /tmp/frontend.log${NC}"
    tail -20 /tmp/frontend.log
    FRONTEND_PID=""
fi

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd "$BACKEND_DIR"
python3 -m uvicorn main:app --reload > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd "$PROJECT_ROOT"
echo -e "${GREEN}Backend server starting (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}Backend logs: /tmp/backend.log${NC}"

# Wait a bit and verify backend is actually running
sleep 2
if check_port_http 8000; then
    echo -e "${GREEN}Backend server is running on http://localhost:8000${NC}"
else
    echo -e "${RED}Backend server failed to start. Check /tmp/backend.log${NC}"
    tail -20 /tmp/backend.log
    BACKEND_PID=""
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        kill_port 3000
        echo -e "${GREEN}Frontend server stopped${NC}"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        kill_port 8000
        echo -e "${GREEN}Backend server stopped${NC}"
    fi
    exit 0
}

# Set up trap to catch Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Print status
echo ""
if [ ! -z "$FRONTEND_PID" ] && [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GREEN}✓ Both servers are running!${NC}"
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}Backend: http://localhost:8000${NC}"
elif [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}⚠ Only frontend server is running${NC}"
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
elif [ ! -z "$BACKEND_PID" ]; then
    echo -e "${YELLOW}⚠ Only backend server is running${NC}"
    echo -e "${GREEN}Backend: http://localhost:8000${NC}"
else
    echo -e "${RED}✗ No servers started. Exiting.${NC}"
    exit 1
fi
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

if [ ! -z "$FRONTEND_PID" ] && [ ! -z "$BACKEND_PID" ]; then
    wait $FRONTEND_PID $BACKEND_PID
elif [ ! -z "$FRONTEND_PID" ]; then
    wait $FRONTEND_PID
elif [ ! -z "$BACKEND_PID" ]; then
    wait $BACKEND_PID
fi

