# Ping Pong App

Simple Next.js frontend with FastAPI backend.

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on http://localhost:8000

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## Usage

Click the "ping" button to send a request to the backend. The response "Pong" will appear in the text box below.

