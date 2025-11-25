from typing import Tuple, Optional, Dict
import uuid
from models import Player, Game, Turn
from game_store import get_game_by_name, save_game, get_game, get_current_turn, save_turn


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


def start_turn(game_id: str) -> Tuple[Turn, Optional[str]]:
    """
    Start a new turn.
    
    Returns:
        Tuple of (Turn object, error_message)
        If error_message is not None, the start failed.
    """
    game = get_game(game_id)
    if not game:
        return None, "Game not found"
    
    if game.status != "playing":
        return None, "Game is not in playing status"
    
    if game.current_turn_index is None:
        return None, "Game turn index not initialized"
    
    # Check if there's already an active turn
    if game.current_turn_id:
        current_turn = get_current_turn(game_id)
        if current_turn and not current_turn.is_complete:
            return current_turn, None
    
    # Get current questioner
    questioner = game.players[game.current_turn_index]
    
    # Create new turn
    turn_id = str(uuid.uuid4())
    turn = Turn(
        turn_id=turn_id,
        game_id=game_id,
        questioner_id=questioner.player_id,
        phase="question"
    )
    
    # Update game
    game.current_turn_id = turn_id
    save_game(game)
    save_turn(turn)
    
    return turn, None


def submit_question(game_id: str, player_id: str, question: str) -> Tuple[bool, Optional[str]]:
    """
    Submit a question for the current turn.
    
    Returns:
        Tuple of (success, error_message)
    """
    game = get_game(game_id)
    if not game:
        return False, "Game not found"
    
    if game.status != "playing":
        return False, "Game is not in playing status"
    
    if game.current_turn_index is None:
        return False, "Game turn index not initialized"
    
    # Check if it's the player's turn
    current_questioner = game.players[game.current_turn_index]
    if current_questioner.player_id != player_id:
        return False, "It's not your turn to ask a question"
    
    # Get or create current turn
    turn = get_current_turn(game_id)
    if not turn:
        turn, error = start_turn(game_id)
        if error:
            return False, error
    
    if turn.phase != "question":
        return False, "Turn is not in question phase"
    
    if not question or not question.strip():
        return False, "Question cannot be empty"
    
    # Set question and move to answer phase
    turn.question = question.strip()
    turn.phase = "answer"
    save_turn(turn)
    
    return True, None


def calculate_scores(turn: Turn, game: Game) -> Dict[str, int]:
    """
    Calculate scores for a turn based on matching answers.
    Uses word similarity to group similar answers together.
    
    Returns:
        Dictionary mapping player_id -> points earned this turn
    """
    scores = {player.player_id: 0 for player in game.players}
    
    if not turn.answers or len(turn.answers) == 0:
        return scores
    
    # Group answers by similar words (using AI/similarity checking)
    from word_similarity import group_similar_words
    word_groups = group_similar_words(turn.answers)  # canonical_word -> list of player_ids
    
    # Check for dud question
    # Dud if: no matches (each word appears only once) OR all same word
    is_dud = False
    if len(word_groups) == len(turn.answers):  # Each word appears only once
        is_dud = True
    elif len(word_groups) == 1:  # All players have the same word
        is_dud = True
    
    if is_dud:
        # Questioner loses 1 point, everyone else gets 0
        scores[turn.questioner_id] = -1
        return scores
    
    # Calculate normal scores
    for canonical_word, player_ids in word_groups.items():
        match_count = len(player_ids) - 1  # Exclude self
        if match_count > 0:
            for player_id in player_ids:
                points = match_count
                # Bonus point if questioner also has this word
                if player_id == turn.questioner_id:
                    # Questioner gets points for matching with others
                    pass  # Already counted
                elif turn.questioner_id in player_ids:
                    # This player matches with questioner, get bonus
                    points += 1
                scores[player_id] = points
    
    return scores


def submit_answer(game_id: str, player_id: str, word: str) -> Tuple[bool, Optional[str]]:
    """
    Submit an answer for the current turn.
    
    Returns:
        Tuple of (success, error_message)
    """
    game = get_game(game_id)
    if not game:
        return False, "Game not found"
    
    if game.status != "playing":
        return False, "Game is not in playing status"
    
    turn = get_current_turn(game_id)
    if not turn:
        return False, "No active turn"
    
    if turn.phase != "answer":
        return False, "Turn is not in answer phase"
    
    # Validate word is single word (no spaces)
    word_trimmed = word.strip()
    if not word_trimmed:
        return False, "Answer cannot be empty"
    
    if ' ' in word_trimmed:
        return False, "Answer must be a single word"
    
    # Check if player already answered
    if player_id in turn.answers:
        return False, "You have already submitted an answer"
    
    # Store answer (normalize to lowercase for matching)
    turn.answers[player_id] = word_trimmed.lower()
    save_turn(turn)
    
    # Check if all players have answered
    if len(turn.answers) == len(game.players):
        # All answered, complete the turn
        complete_turn(game_id)
    
    return True, None


def complete_turn(game_id: str) -> Tuple[bool, Optional[str]]:
    """
    Complete the current turn by calculating scores and moving to next turn.
    
    Returns:
        Tuple of (success, error_message)
    """
    game = get_game(game_id)
    if not game:
        return False, "Game not found"
    
    turn = get_current_turn(game_id)
    if not turn:
        return False, "No active turn"
    
    if turn.is_complete:
        return True, None  # Already completed
    
    # Calculate scores
    scores = calculate_scores(turn, game)
    turn.scores = scores
    
    # Update player scores
    for player_id, points in scores.items():
        player = next((p for p in game.players if p.player_id == player_id), None)
        if player:
            player.score += points
    
    # Mark turn as complete
    turn.phase = "scoring"
    turn.is_complete = True
    save_turn(turn)
    
    # Move to next turn
    game.current_turn_index += 1
    if game.current_turn_index >= len(game.players):
        game.current_turn_index = 0
        game.current_round += 1
    
    # Check if game is finished
    if check_game_end(game):
        game.status = "finished"
        game.current_turn_id = None
    else:
        # Clear current turn for next turn
        game.current_turn_id = None
    
    save_game(game)
    return True, None


def check_game_end(game: Game) -> bool:
    """
    Check if the game has ended.
    
    Returns:
        True if game is finished, False otherwise
    """
    if game.status == "finished":
        return True
    
    if game.rounds_per_player is None:
        return False
    
    return game.current_round >= game.rounds_per_player

