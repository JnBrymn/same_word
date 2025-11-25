from typing import Tuple, Optional
import uuid
from models import Player, Game
from game_store import get_game_by_name, save_game, get_game


def create_game(game_name: str, creator_name: str) -> Tuple[Game, str]:
    """
    Create a new game.
    
    Returns:
        Tuple of (Game object, player_id of creator)
    """
    # Validate game_name is lowercase
    game_name_lower = game_name.lower()
    if game_name != game_name_lower:
        raise ValueError("Game name must be lowercase")
    
    # Check if game name already exists
    existing_game = get_game_by_name(game_name_lower)
    if existing_game and existing_game.status != "finished":
        raise ValueError("Game name already exists")
    
    # Create game
    game_id = str(uuid.uuid4())
    creator_id = str(uuid.uuid4())
    
    creator = Player(
        name=creator_name,
        player_id=creator_id,
        is_creator=True
    )
    
    game = Game(
        game_id=game_id,
        game_name=game_name_lower,
        players=[creator],
        creator_id=creator_id,
        status="waiting"
    )
    
    save_game(game)
    return game, creator_id


def join_game(game_name: str, player_name: str) -> Tuple[Game, str, Optional[str]]:
    """
    Join an existing game.
    
    Returns:
        Tuple of (Game object, player_id, error_message)
        If error_message is not None, the join failed.
    """
    # Validate game_name is lowercase
    game_name_lower = game_name.lower()
    if game_name != game_name_lower:
        raise ValueError("Game name must be lowercase")
    
    # Find game
    game = get_game_by_name(game_name_lower)
    if not game:
        return None, None, "Game not found"
    
    if game.status != "waiting":
        return None, None, "Game is not accepting new players"
    
    # Validate player_name is unique (case-insensitive)
    player_name_lower = player_name.lower()
    for existing_player in game.players:
        if existing_player.name.lower() == player_name_lower:
            return None, None, "Player name already taken in this game"
    
    # Add player
    player_id = str(uuid.uuid4())
    new_player = Player(
        name=player_name,
        player_id=player_id,
        is_creator=False
    )
    
    game.players.append(new_player)
    save_game(game)
    
    return game, player_id, None


def start_game(game_id: str, player_id: str, rounds_per_player: int) -> Tuple[bool, Optional[str]]:
    """
    Start a game.
    
    Returns:
        Tuple of (success, error_message)
        If error_message is not None, the start failed.
    """
    game = get_game(game_id)
    if not game:
        return False, "Game not found"
    
    # Validate player is creator
    if game.creator_id != player_id:
        return False, "Only the game creator can start the game"
    
    # Validate game status
    if game.status != "waiting":
        return False, "Game is not in waiting status"
    
    # Validate rounds
    if rounds_per_player < 1:
        return False, "Rounds per player must be at least 1"
    
    # Start the game
    game.status = "playing"
    game.rounds_per_player = rounds_per_player
    game.current_turn_index = 0
    game.current_round = 0
    
    save_game(game)
    return True, None

