# Same Word - Product Requirements Document

## Overview
Same Word is a multiplayer word game where players take turns asking questions, and everyone (including the questioner) provides single-word answers. Points are awarded based on matching answers.

## Website Structure

### 1. Find a Game Page (Home Page)

Players can join an existing game or create a new one.

**Fields:**
- Your Name: [___________]
- Join a game: [___________] [GO]
- Create new game: [___________] [GO]

**Behavior:**
- Game names must match exactly (only lower case allowed)
- Player names for a particular game must be unique (when lowercased) Otherwise, it makes you re-enter your name. 
- After clicking "GO", players proceed to the waiting room

---

### 2. Waiting Room

**For all players:**
- Displays the number of people who have joined the game
- Shows the names of all players currently in the game

**For game creator:**
- Same information as above
- Number of rounds input
- Additional "Start Game" button to begin the game

**For non-creators:**
- Wait and watch as other players join
- No action buttons available

---

### 3. Game Page

#### Game Flow

**Turn Structure:**

1. **Question Phase**
   - The current player (whose turn it is) types a question
   - Everyone sees the question

2. **Answer Phase**
   - Everyone (including the questioner) types a single word answer in their input box
   - Once all players have submitted their word, the answers are revealed simultaneously

3. **Scoring Phase**
   - Scores are calculated automatically based on matching words

#### Scoring Rules

- **Matching with other players:** If your word matches with any other player, you get 1 point per player that it matches with
- **Matching with questioner:** If your word also matches with the person who asked the question, you get an additional 1 point
- **Dud question penalty:** If the questioner asks a question where:
  - No one has the same word (no matches), OR
  - Everyone has the same word (all matches)
  - Then it's a "dud question": no one gets any points, and the questioner loses 1 point

#### Game End

- Players take turns asking questions in the same order
- The game ends after all players have asked questions X times
- Players choose the value of X at the start of the game

--- 

# Next Steps
- When someone is typing, we indicate it.
- It's annoying to be wrong just because you spelled it differently
   - use AI to figure out if the answers are "close enough"
- If group size is too large, the UI gets crowded
- With too many players, rounds may be too long; may need to randomly select players to ask questions - though the scoring isn't quite fair in that case
- Game creator can share invite link with others
- Show when a user is typing (typing indicators)
- Add a time limit for answers and/or rounds
- Option for the game to automatically ask questions (instead of players)
- Option for the game to use multiple choice for answers
- After a game is finished, can you use the name again?
- Give the game creator more configurations (like auto ask questions, or provide multiple-choice answers)
- When creator makes game, make it public or private - if private, you can join by link or by typing in the name of the game
- Make "open" games that anyone can join