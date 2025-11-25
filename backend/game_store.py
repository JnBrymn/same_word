from typing import Dict, Optional
from models import Game


# In-memory storage for games
games: Dict[str, Game] = {}
games_by_name: Dict[str, str] = {}  # maps lowercase game_name -> game_id


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

