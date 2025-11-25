# Same Word - Implementation Guide

This document outlines the step-by-step implementation plan for building the Same Word game.

## Architecture Overview

- **Backend**: FastAPI (Python) - handles game state, logic, and real-time updates
- **Frontend**: Next.js (React/TypeScript) - three main pages/components
- **Real-time**: WebSocket or polling mechanism for live updates

---

## Phase 1: Game Creation/Joining Page

### Step 1.1: Minimal Backend Support for Game Creation/Joining

**File**: `backend/models.py`

Create basic data models:
- `Player`: name, player_id, score, is_creator
- `Game`: game_id, game_name (lowercase), players list, creator_id, status (waiting/playing/finished)

**File**: `backend/game_store.py`

Create simple in-memory store:
- Dictionary: `games: dict[str, Game]` keyed by game_id
- Dictionary: `games_by_name: dict[str, str]` maps lowercase game_name -> game_id

**File**: `backend/game_manager.py`

Implement:
- `create_game(game_name: str, creator_name: str) -> Game`
  - Validate game_name is lowercase
  - Create game with unique game_id
  - Add creator as first player
  - Return game object
  
- `join_game(game_name: str, player_name: str) -> tuple[Game, bool, str?]`
  - Find game by name (case-insensitive lookup, but store lowercase)
  - Validate player_name is unique (case-insensitive)
  - Add player to game
  - Return (game, success, error_message?) tuple

### Step 1.2: Backend API Endpoints

**File**: `backend/main.py`

Add endpoints:
- `POST /api/games/create`
  - Body: `{game_name: str, player_name: str}`
  - Validate game_name is lowercase
  - Create game via game_manager
  - Return: `{game_id, player_id, success}`

- `POST /api/games/join`
  - Body: `{game_name: str, player_name: str}`
  - Validate game_name is lowercase
  - Validate player_name is unique (case-insensitive)
  - Join game via game_manager
  - Return: `{game_id, player_id, success, error?}`

### Step 1.3: Frontend - Find a Game Page

**File**: `frontend/app/page.tsx`

Implement:
- Form with:
  - Name input field
  - Join game input + button
  - Create game input + button
- State management for form inputs
- Validation (lowercase game names, non-empty names)

**File**: `frontend/app/page.tsx`

Add API integration:
- `handleCreateGame()` function
  - Call `POST /api/games/create`
  - On success, redirect to `/waiting-room?game_id={game_id}&player_id={player_id}`
  
- `handleJoinGame()` function
  - Call `POST /api/games/join`
  - Handle error if name already taken (show message, allow re-entry)
  - On success, redirect to `/waiting-room?game_id={game_id}&player_id={player_id}`

---

## Phase 2: Waiting Room Page

### Step 2.1: Update Game Model for Game Start

**File**: `backend/models.py`

Update `Game` model to add fields needed for starting game:
- Add: `rounds_per_player: int | None` (None until game starts)
- Add: `current_turn_index: int | None` (None until game starts)
- Add: `current_round: int` (starts at 0, increments after each full rotation)

**Note**: These fields are needed now because `POST /api/games/{game_id}/start` will set them.

### Step 2.2: Backend Support for Waiting Room

**File**: `backend/main.py`

Add endpoints:
- `GET /api/games/{game_id}`
  - Return current game state (players, status, etc.)
  - Include: players list with names, creator_id, status, rounds_per_player (if set)
  - Ensure players list maintains order (this will be the turn order)

- `POST /api/games/{game_id}/start`
  - Body: `{player_id: str, rounds_per_player: int}`
  - Validate player is creator
  - Validate game status is "waiting"
  - Set game status to "playing"
  - Store rounds_per_player
  - Initialize turn order (set current_turn_index to 0, current_round to 0)
  - Ensure players list is in a consistent order (use creation/join order)
  - Return success

### Step 2.3: Frontend - Waiting Room Component

**File**: `frontend/app/waiting-room/page.tsx`

Implement:
- Get game_id and player_id from URL params
- Display player count
- Display list of player names
- Basic layout and styling

### Step 2.4: Real-Time Player Updates

**File**: `frontend/app/waiting-room/page.tsx`

Add:
- Poll `GET /api/games/{game_id}` every 1-2 seconds
- Update player list when new players join
- Show loading state while fetching
- If game status changes to "playing", automatically redirect to game page

### Step 2.5: Creator Controls

**File**: `frontend/app/waiting-room/page.tsx`

Add:
- Check if current player is creator (compare player_id with creator_id from game state)
- If creator: show rounds input field and "Start Game" button
- `handleStartGame()` function
  - Validate rounds input (positive integer, minimum 1)
  - Call `POST /api/games/{game_id}/start` with rounds_per_player
  - Redirect to `/game?game_id={game_id}&player_id={player_id}`

---

## Phase 3: Game Page

### Step 3.1: Backend Game Logic Foundation

**File**: `backend/models.py`

Add to models:
- `Turn`: turn_id, game_id, questioner_id, question, answers (dict: player_id -> word), scores (dict: player_id -> points), is_complete, phase (question/answer/scoring)

Update `Game` model:
- Add: `current_turn_id: str | None` (None when no active turn)
- Note: `rounds_per_player`, `current_turn_index`, and `current_round` were already added in Phase 2.1

**File**: `backend/game_store.py`

Add turn storage:
- Dictionary: `turns: dict[str, Turn]` keyed by turn_id
- Dictionary: `turns_by_game: dict[str, list[str]]` maps game_id -> list of turn_ids

**File**: `backend/game_logic.py`

Implement:
- `start_turn(game_id: str) -> Turn`
  - Get current questioner based on turn_index (players[current_turn_index])
  - Create new Turn object with unique turn_id
  - Set turn phase to "question"
  - Set game.current_turn_id
  - Store turn in game_store
  - Return turn

- `submit_question(game_id: str, player_id: str, question: str) -> bool`
  - Validate it's the player's turn (check current_turn_index matches player)
  - Validate game has active turn (current_turn_id is set)
  - Get current turn
  - Validate turn phase is "question"
  - Set question on current turn
  - Move turn phase to "answer"
  - Return success

- `submit_answer(game_id: str, player_id: str, word: str) -> bool`
  - Validate game is in answer phase (turn.phase == "answer")
  - Validate word is single word (no spaces, trim whitespace)
  - Store answer in turn.answers[player_id] = word.lowercase() (normalize for matching)
  - Check if all players have answered (len(turn.answers) == len(game.players))
  - If all answered, trigger scoring automatically
  - Return success

- `calculate_scores(turn: Turn, game: Game) -> dict[str, int]`
  - Initialize scores dict with 0 for all players
  - Group answers by word (normalize to lowercase for comparison)
  - For each unique word, count how many players have it
  - Apply scoring rules:
    - For each player with a word:
      - Count matches: number of OTHER players with same word
      - Points = matches (1 point per matching player, excluding self)
      - If questioner also has this word: add +1 extra point
    - Check for dud question:
      - If no matches at all (each word appears only once), OR
      - If all players have the same word
      - Then: questioner gets -1, all others get 0 (override previous scores)
  - Return scores dict

- `complete_turn(game_id: str) -> bool`
  - Get current turn
  - Calculate scores using calculate_scores()
  - Update turn.scores with calculated scores
  - Update each player's total score (add turn scores)
  - Set turn phase to "scoring"
  - Set turn.is_complete = True
  - Move to next turn:
    - Increment current_turn_index
    - If current_turn_index >= len(players):
      - Reset current_turn_index to 0
      - Increment current_round
  - Check if game is finished using check_game_end()
  - Return success

- `check_game_end(game: Game) -> bool`
  - Check if current_round >= rounds_per_player
  - If yes, set status to "finished"
  - Return True if finished, False otherwise

### Step 3.2: Backend API Endpoints for Game

**File**: `backend/main.py`

Add endpoints:
- `POST /api/games/{game_id}/start-turn`
  - Body: `{player_id: str}` (optional, can auto-start)
  - If no current turn exists, start a new turn using start_turn()
  - Return: `{turn_id, questioner_id, success}`

- `POST /api/games/{game_id}/question`
  - Body: `{player_id: str, question: str}`
  - If no current turn, start one first
  - Submit question for current turn
  - Return success

- `POST /api/games/{game_id}/answer`
  - Body: `{player_id: str, word: str}`
  - Submit answer for current turn
  - If all players answered, automatically call complete_turn()
  - Return success

- `GET /api/games/{game_id}`
  - Update to include turn information:
    - current_turn_id, current_turn_index, current_round
    - If turn exists: turn phase, question (if submitted), answers (if phase is "scoring" or "answer" and player has answered)
    - Current questioner name

- `GET /api/games/{game_id}/turn`
  - Return current turn state (question, answers if revealed, phase, scores if calculated)
  - Alternative: This info can be included in GET /api/games/{game_id}

### Step 3.3: Frontend - Game Page Component

**File**: `frontend/app/game/page.tsx`

Implement:
- Get game_id and player_id from URL params
- Display current scores for all players
- Display whose turn it is
- Basic layout

### Step 3.4: Question Phase UI

**File**: `frontend/app/game/page.tsx`

Add:
- Poll `GET /api/games/{game_id}` to get current game state
- Determine current questioner from game.players[game.current_turn_index]
- Check turn phase from game state (or turn.phase)
- If no turn exists or turn phase is "question":
  - If current player's turn: show question input field and submit button
  - If not current player's turn: show "Waiting for [player name] to ask a question..."
- Display current question once submitted (from turn.question)
- `handleSubmitQuestion()` function
  - Validate question is not empty
  - Call `POST /api/games/{game_id}/question`
  - Update UI to answer phase (will be detected on next poll)

### Step 3.5: Answer Phase UI

**File**: `frontend/app/game/page.tsx`

Add:
- Detect answer phase: turn.phase === "answer"
- Show question prominently
- Check if current player has already answered (player_id in turn.answers)
- If not answered: show input field for single word answer and submit button
- If already answered: show "You answered: [word]" and disable input
- Show "Waiting for other players..." message with count of remaining players
- `handleSubmitAnswer()` function
  - Validate word is not empty and is single word (no spaces)
  - Call `POST /api/games/{game_id}/answer`
  - Update local state to show player's answer
  - Wait for all players to answer (detected via polling)

### Step 3.6: Scoring Phase UI

**File**: `frontend/app/game/page.tsx`

Add:
- Detect scoring phase: turn.phase === "scoring" or turn.is_complete === true
- Once all answers submitted, reveal all words from turn.answers
- Display words grouped by matches (group players by their word)
- Show points earned this turn from turn.scores[player_id]
- Show updated total scores from game.players (each player's score)
- Show "Turn complete!" message
- Auto-advance to next turn after 3-5 seconds, OR
- "Next Turn" button that calls `POST /api/games/{game_id}/start-turn` to begin next turn

### Step 3.7: Real-Time Game Updates

**File**: `frontend/app/game/page.tsx`

Add:
- Poll `GET /api/games/{game_id}` every 1-2 seconds
- Update UI when:
  - Question is submitted
  - Answers are submitted
  - Turn completes
  - Game ends

### Step 3.8: Game End UI

**File**: `frontend/app/game/page.tsx`

Add:
- Detect when game status is "finished"
- Show final scores
- Show winner(s)
- Option to return to home page or create new game

---

## Phase 4: Real-Time Updates Enhancement

### Step 4.1: Choose Real-Time Mechanism
**Option A: WebSocket (Recommended)**
- Use FastAPI WebSocket support
- More efficient for real-time updates

**Option B: Polling (Current)**
- Already implemented, but can optimize
- Add `GET /api/games/{game_id}/updates?last_update_time=timestamp`
- Frontend polls every 1-2 seconds

### Step 4.2: Implement WebSocket (Optional Upgrade)

**File**: `backend/main.py` or `backend/websocket.py`

If using WebSocket:
- `WebSocket /api/games/{game_id}/ws`
- Broadcast game state changes to all connected clients
- Handle connection/disconnection
- Replace polling in frontend with WebSocket connections

---

## Phase 5: Polish and Error Handling

### Step 5.1: Input Validation
- Backend: Validate all inputs (non-empty, proper types, etc.)
- Frontend: Client-side validation with user-friendly error messages

### Step 5.2: Error Handling
- Backend: Return proper HTTP status codes and error messages
- Frontend: Handle network errors, display error messages

### Step 5.3: Edge Cases
- Handle player disconnection
- Handle duplicate submissions
- Handle invalid game states
- Handle game not found errors

### Step 5.4: UI/UX Improvements
- Loading states
- Disable buttons during API calls
- Clear visual feedback for all actions
- Responsive design

---

## Phase 6: Testing

### Step 6.1: Backend Unit Tests
- Test game creation and joining
- Test scoring logic (all scenarios)
- Test turn management
- Test dud question detection

### Step 6.2: Integration Tests
- Test full game flow
- Test multiple players
- Test error scenarios

### Step 6.3: Manual Testing
- Test with 2-4 players
- Test all scoring scenarios
- Test edge cases

---

## Implementation Order Summary

1. **Phase 1: Game Creation/Joining Page**
   - Backend models and game manager (1.1)
   - Backend API endpoints (1.2)
   - Frontend page (1.3)

2. **Phase 2: Waiting Room Page**
   - Update Game model (2.1)
   - Backend API endpoints (2.2)
   - Frontend component (2.3)
   - Real-time updates (2.4)
   - Creator controls (2.5)

3. **Phase 3: Game Page**
   - Backend game logic and Turn model (3.1)
   - Backend API endpoints (3.2)
   - Frontend component (3.3)
   - Question phase (3.4)
   - Answer phase (3.5)
   - Scoring phase (3.6)
   - Real-time updates (3.7)
   - Game end (3.8)

4. **Phase 4: Real-Time Updates Enhancement** (Optional)
5. **Phase 5: Polish and Error Handling**
6. **Phase 6: Testing**

---

## Notes

- Start with in-memory storage (can add database later if needed)
- Use polling initially for simplicity (can upgrade to WebSocket later)
- Focus on getting core game flow working before adding polish
- Test with multiple browser windows/tabs to simulate multiple players
- Each phase builds on the previous one, so complete them in order

## Important Implementation Details

- **Player order**: The order players are added to the game (creation/join order) determines turn order. Maintain this order consistently.
- **Word matching**: Normalize all words to lowercase for comparison (store lowercase, compare lowercase)
- **Turn initialization**: First turn is created when game starts OR when first question is submitted (either approach works)
- **Scoring clarification**: 
  - If Player A's word matches with Players B and C: Player A gets 2 points (1 per match)
  - If Player A's word also matches questioner: Player A gets 3 points total (2 + 1 bonus)
  - Dud question: If no matches OR all same word, questioner loses 1 point, everyone else gets 0
- **Game state**: Always include turn information in GET /api/games/{game_id} response so frontend can determine current phase
