#!/bin/bash

# Production startup script for Fly.io
# Starts both Next.js frontend and FastAPI backend

set -e

# Start FastAPI backend in the background
echo "Starting FastAPI backend on port 8000..."
cd /app/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start Next.js frontend
echo "Starting Next.js frontend on port 3000..."
cd /app
# Next.js standalone mode creates server.js in the root of the standalone directory
if [ -f "server.js" ]; then
    PORT=3000 node server.js &
elif [ -f ".next/standalone/server.js" ]; then
    PORT=3000 node .next/standalone/server.js &
else
    echo "Error: Could not find Next.js server.js file"
    exit 1
fi
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set up trap to catch signals
trap cleanup SIGTERM SIGINT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

