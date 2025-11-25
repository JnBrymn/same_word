# Ping Pong App

Simple Next.js frontend with FastAPI backend.

## Local Development

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

### Using the start script
```bash
./scripts/start_servers.sh
```

## Usage

Click the "ping" button to send a request to the backend. The response "Pong" will appear in the text box below.

## Deployment to Fly.io

1. Install flyctl: https://fly.io/docs/getting-started/installing-flyctl/

2. Login to Fly.io:
```bash
flyctl auth login
```

3. Create the app (if not already created):
```bash
flyctl apps create same-word
```

4. Deploy:
```bash
flyctl deploy
```

5. Open your app:
```bash
flyctl open
```

The app will be available at `https://same-word.fly.dev`
