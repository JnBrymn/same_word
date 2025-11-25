# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# Ensure public directory exists (Next.js requires it)
RUN mkdir -p public
RUN npm run build

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for running Next.js
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ ./backend/

# Copy frontend standalone build from builder
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Copy startup script
COPY scripts/start_production.sh ./start_production.sh
RUN chmod +x ./start_production.sh

EXPOSE 3000 8000

CMD ["./start_production.sh"]

