from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict

app = FastAPI()

import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class CreateGameRequest(BaseModel):
    game_name: str
    player_name: str

class CreateGameResponse(BaseModel):
    game_id: str
    player_id: str
    success: bool

class JoinGameRequest(BaseModel):
    game_name: str
    player_name: str

class JoinGameResponse(BaseModel):
    game_id: Optional[str] = None
    player_id: Optional[str] = None
    success: bool
    error: Optional[str] = None

class StartGameRequest(BaseModel):
    player_id: str
    rounds_per_player: int

class StartGameResponse(BaseModel):
    success: bool
    error: Optional[str] = None

class PlayerInfo(BaseModel):
    name: str
    player_id: str
    score: int
    is_creator: bool

class TurnInfo(BaseModel):
    turn_id: str
    questioner_id: str
    question: Optional[str] = None
    phase: str  # question, answer, scoring
    is_complete: bool
    answers: Optional[Dict[str, str]] = None  # player_id -> word (only shown if phase is scoring or player has answered)
    scores: Optional[Dict[str, int]] = None  # player_id -> points (only shown if phase is scoring)

class GameStateResponse(BaseModel):
    game_id: str
    game_name: str
    players: list[PlayerInfo]
    creator_id: str
    status: str
    rounds_per_player: Optional[int] = None
    current_turn_index: Optional[int] = None
    current_round: int = 0
    current_turn: Optional[TurnInfo] = None

class QuestionRequest(BaseModel):
    player_id: str
    question: str

class AnswerRequest(BaseModel):
    player_id: str
    word: str

class StartTurnRequest(BaseModel):
    player_id: Optional[str] = None

class ActionResponse(BaseModel):
    success: bool
    error: Optional[str] = None

@app.get("/ping")
def ping():
    return {"message": "Pong"}

@app.post("/api/games/create", response_model=CreateGameResponse)
def create_game(request: CreateGameRequest):
    """Create a new game."""
    try:
        # Validate game_name is lowercase
        if request.game_name != request.game_name.lower():
            raise HTTPException(status_code=400, detail="Game name must be lowercase")
        
        if not request.game_name.strip():
            raise HTTPException(status_code=400, detail="Game name cannot be empty")
        
        if not request.player_name.strip():
            raise HTTPException(status_code=400, detail="Player name cannot be empty")
        
        from game_manager import create_game
        game, player_id = create_game(request.game_name, request.player_name)
        
        return CreateGameResponse(
            game_id=game.game_id,
            player_id=player_id,
            success=True
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/games/join", response_model=JoinGameResponse)
def join_game(request: JoinGameRequest):
    """Join an existing game."""
    try:
        # Validate game_name is lowercase
        if request.game_name != request.game_name.lower():
            raise HTTPException(status_code=400, detail="Game name must be lowercase")
        
        if not request.game_name.strip():
            raise HTTPException(status_code=400, detail="Game name cannot be empty")
        
        if not request.player_name.strip():
            raise HTTPException(status_code=400, detail="Player name cannot be empty")
        
        from game_manager import join_game
        game, player_id, error = join_game(request.game_name, request.player_name)
        
        if error:
            return JoinGameResponse(
                success=False,
                error=error
            )
        
        return JoinGameResponse(
            game_id=game.game_id,
            player_id=player_id,
            success=True
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/games/{game_id}", response_model=GameStateResponse)
def get_game_state(game_id: str, player_id: Optional[str] = None):
    """Get current game state."""
    try:
        from game_store import get_game, get_current_turn
        game = get_game(game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Convert players to PlayerInfo
        players_info = [
            PlayerInfo(
                name=player.name,
                player_id=player.player_id,
                score=player.score,
                is_creator=player.is_creator
            )
            for player in game.players
        ]
        
        # Get turn information
        turn_info = None
        if game.current_turn_id:
            turn = get_current_turn(game_id)
            if turn:
                # Determine what answers to show
                answers_to_show = None
                if turn.phase == "scoring" or turn.is_complete:
                    # Show all answers
                    answers_to_show = turn.answers
                elif turn.phase == "answer" and player_id:
                    # Show only if this player has answered
                    if player_id in turn.answers:
                        answers_to_show = {player_id: turn.answers[player_id]}
                
                scores_to_show = None
                if turn.phase == "scoring" or turn.is_complete:
                    scores_to_show = turn.scores
                
                turn_info = TurnInfo(
                    turn_id=turn.turn_id,
                    questioner_id=turn.questioner_id,
                    question=turn.question,
                    phase=turn.phase,
                    is_complete=turn.is_complete,
                    answers=answers_to_show,
                    scores=scores_to_show
                )
        
        return GameStateResponse(
            game_id=game.game_id,
            game_name=game.game_name,
            players=players_info,
            creator_id=game.creator_id,
            status=game.status,
            rounds_per_player=game.rounds_per_player,
            current_turn_index=game.current_turn_index,
            current_round=game.current_round,
            current_turn=turn_info
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/games/{game_id}/start", response_model=StartGameResponse)
def start_game(game_id: str, request: StartGameRequest):
    """Start a game."""
    try:
        from game_manager import start_game
        success, error = start_game(game_id, request.player_id, request.rounds_per_player)
        
        if not success:
            return StartGameResponse(success=False, error=error)
        
        return StartGameResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/games/{game_id}/start-turn", response_model=ActionResponse)
def start_turn_endpoint(game_id: str, request: StartTurnRequest):
    """Start a new turn."""
    try:
        from game_manager import start_turn
        turn, error = start_turn(game_id)
        
        if error:
            return ActionResponse(success=False, error=error)
        
        return ActionResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/games/{game_id}/question", response_model=ActionResponse)
def submit_question_endpoint(game_id: str, request: QuestionRequest):
    """Submit a question for the current turn."""
    try:
        from game_manager import submit_question
        success, error = submit_question(game_id, request.player_id, request.question)
        
        if not success:
            return ActionResponse(success=False, error=error)
        
        return ActionResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/games/{game_id}/answer", response_model=ActionResponse)
def submit_answer_endpoint(game_id: str, request: AnswerRequest):
    """Submit an answer for the current turn."""
    try:
        from game_manager import submit_answer
        success, error = submit_answer(game_id, request.player_id, request.word)
        
        if not success:
            return ActionResponse(success=False, error=error)
        
        return ActionResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

