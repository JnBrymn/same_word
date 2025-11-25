# Same Word

A multiplayer word game where players take turns asking questions, and everyone provides single-word answers. Points are awarded based on matching answers with other players.

**🎮 Play now at: [https://same-word.fly.dev/](https://same-word.fly.dev/)**

**📺 Watch us build it live: [YouTube Video](https://www.youtube.com/watch?v=BrQe1q-IKmY)**

---

## How to Play

### Getting Started

1. **Enter your name** in the "Your Name" field
2. **Create a new game** or **join an existing game** by entering the game name (must be lowercase)
3. Wait in the **Waiting Room** for other players to join
4. The game creator sets the number of rounds and starts the game

### Gameplay

The game consists of multiple turns, with each player taking turns asking questions.

#### Turn Structure

1. **Question Phase**
   - The current player types a question
   - Everyone sees the question

2. **Answer Phase**
   - Everyone (including the questioner) types a **single word** answer
   - See live typing indicators when other players are typing
   - Answers are revealed simultaneously once all players have submitted
   - You can see which players have answered (but not their words) until everyone submits

3. **Scoring Phase**
   - Scores are calculated automatically based on matching words
   - Score changes are displayed with color-coded feedback (green for points gained, red for points lost)
   - All previous turns remain visible so you can review the game history as you play

### Scoring Rules

- **Matching with other players:** If your word matches with any other player, you get **1 point per player** that it matches with
- **Matching with questioner:** If your word also matches with the person who asked the question, you get an **additional 1 point**
- **Smart word matching:** The game uses AI to recognize similar words, so "color" matches "colour", "dog" matches "dogs", and synonyms count as matches. Don't worry about spelling variations!
- **Dud question penalty:** If the questioner asks a question where:
  - No one has the same word (no matches), OR
  - Everyone has the same word (all matches)
  - Then it's a "dud question": no one gets any points, and the questioner **loses 1 point**

### Game End

- Players take turns asking questions in the same order
- The game ends after all players have asked questions X times (where X is chosen at the start)
- The player(s) with the highest score wins!
- Celebrate with fireworks animation 🎆
- Review the complete game history with all questions, answers, and scores

---

## Technical Details

### Architecture

- **Backend**: FastAPI (Python) - handles game state, logic, and real-time updates
- **Frontend**: Next.js (React/TypeScript) - responsive web interface
- **Real-time**: Polling mechanism (1.5s intervals) for live game state updates
- **Word Matching**: AI-powered semantic similarity using OpenAI API (with fallback to exact matching)
- **Deployment**: Fly.io

### Features

- **Real-time game state synchronization** - Polling-based updates keep all players in sync
- **AI-powered word similarity matching** - Uses OpenAI to intelligently match similar words (e.g., "color" matches "colour", "dog" matches "dogs", synonyms). Falls back to exact matching if AI is unavailable
- **Live typing indicators** - See when other players are typing their answers
- **Score tracking with visual feedback** - Color-coded score changes (green for gains, red for losses) shown after each turn
- **Full turn history** - View all previous turns and answers throughout the game
- **Game end celebration** - Fireworks animation when the game finishes
- **Complete game review** - After the game ends, review the entire game history with all questions, answers, and scores
- **Responsive design** - Works seamlessly on desktop and mobile devices

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on http://localhost:8000

**Optional:** To enable AI-powered word similarity matching, set the `OPENAI_API_KEY` environment variable:
```bash
export OPENAI_API_KEY=your_api_key_here
```

Without the API key, the game will use exact word matching (case-insensitive).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

### Using the Start Script

```bash
./scripts/start_servers.sh
```

This will start both the backend and frontend servers simultaneously.

---

## Deployment

The app is deployed to Fly.io at [https://same-word.fly.dev/](https://same-word.fly.dev/)

### Deploying to Fly.io

1. Install flyctl: https://fly.io/docs/getting-started/installing-flyctl/

2. Login to Fly.io:
```bash
flyctl auth login
```

3. Deploy:
```bash
./scripts/deploy.sh
```

Or manually:
```bash
flyctl deploy
```

---

## About

This game was built live on YouTube! Check out the build process: [https://www.youtube.com/watch?v=BrQe1q-IKmY](https://www.youtube.com/watch?v=BrQe1q-IKmY)

---

## License

MIT
