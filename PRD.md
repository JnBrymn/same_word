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
- Make sure we can see everyone's answer.
  - when people answer, show that they have answered but blank out their answer under their name
- When someone is typing, we indicate it.
- It's annoying to be wrong just because you spelled it differently
- When people are playing it says "1/N have answered" but that never updates
- use AI to figure out if the answers are "close enough"
- when the scoring is calculated, show the deltas as green and red above the score
- final score fireworks
