from typing import Dict, Optional, List
from models import Game, Turn


# In-memory storage for games
games: Dict[str, Game] = {}
games_by_name: Dict[str, str] = {}  # maps lowercase game_name -> game_id

# In-memory storage for turns
turns: Dict[str, Turn] = {}
turns_by_game: Dict[str, List[str]] = {}  # maps game_id -> list of turn_ids


def get_game(game_id: str) -> Game | None:
    """Get a game by its ID."""
    return games.get(game_id)


def get_game_by_name(game_name: str) -> Game | None:
    """Get a game by its name (case-insensitive lookup)."""
    game_name_lower = game_name.lower()
    game_id = games_by_name.get(game_name_lower)
    if game_id:
        return games.get(game_id)
    return None


def save_game(game: Game) -> None:
    """Save a game to storage."""
    games[game.game_id] = game
    games_by_name[game.game_name.lower()] = game.game_id


def get_turn(turn_id: str) -> Turn | None:
    """Get a turn by its ID."""
    return turns.get(turn_id)


def get_current_turn(game_id: str) -> Turn | None:
    """Get the current turn for a game."""
    game = get_game(game_id)
    if not game or not game.current_turn_id:
        return None
    return get_turn(game.current_turn_id)


def save_turn(turn: Turn) -> None:
    """Save a turn to storage."""
    turns[turn.turn_id] = turn
    if turn.game_id not in turns_by_game:
        turns_by_game[turn.game_id] = []
    if turn.turn_id not in turns_by_game[turn.game_id]:
        turns_by_game[turn.game_id].append(turn.turn_id)


def get_all_turns(game_id: str) -> List[Turn]:
    """Get all turns for a game in chronological order."""
    if game_id not in turns_by_game:
        return []
    
    turn_ids = turns_by_game[game_id]
    return [turns[tid] for tid in turn_ids if tid in turns]


def get_all_waiting_games() -> List[Game]:
    """Get all games with status 'waiting'."""
    return [game for game in games.values() if game.status == "waiting"]

