"""
Tests for game_store module - storage layer tests.
"""
import pytest
from models import Game, Player, Turn
import game_store


class TestGameStore:
    """Test game storage operations."""
    
    def test_get_game_not_found(self):
        """Test getting a non-existent game returns None."""
        assert game_store.get_game("nonexistent") is None
    
    def test_save_and_get_game(self):
        """Test saving and retrieving a game."""
        game = Game(
            game_id="test-id",
            game_name="testgame",
            players=[],
            status="waiting"
        )
        game_store.save_game(game)
        
        retrieved = game_store.get_game("test-id")
        assert retrieved is not None
        assert retrieved.game_id == "test-id"
        assert retrieved.game_name == "testgame"
    
    def test_get_game_by_name(self):
        """Test getting a game by name (case-insensitive)."""
        game = Game(
            game_id="test-id",
            game_name="testgame",
            players=[],
            status="waiting"
        )
        game_store.save_game(game)
        
        # Test case-insensitive lookup
        assert game_store.get_game_by_name("testgame") is not None
        assert game_store.get_game_by_name("TESTGAME") is not None
        assert game_store.get_game_by_name("TestGame") is not None
        assert game_store.get_game_by_name("nonexistent") is None
    
    def test_save_turn_and_get_turn(self):
        """Test saving and retrieving a turn."""
        turn = Turn(
            turn_id="turn-1",
            game_id="game-1",
            questioner_id="player-1",
            phase="question"
        )
        game_store.save_turn(turn)
        
        retrieved = game_store.get_turn("turn-1")
        assert retrieved is not None
        assert retrieved.turn_id == "turn-1"
        assert retrieved.game_id == "game-1"
    
    def test_get_current_turn(self):
        """Test getting current turn for a game."""
        # Create game with current turn
        game = Game(
            game_id="game-1",
            game_name="testgame",
            players=[],
            status="playing",
            current_turn_id="turn-1"
        )
        game_store.save_game(game)
        
        turn = Turn(
            turn_id="turn-1",
            game_id="game-1",
            questioner_id="player-1",
            phase="question"
        )
        game_store.save_turn(turn)
        
        current_turn = game_store.get_current_turn("game-1")
        assert current_turn is not None
        assert current_turn.turn_id == "turn-1"
    
    def test_get_current_turn_no_turn(self):
        """Test getting current turn when game has no current turn."""
        game = Game(
            game_id="game-1",
            game_name="testgame",
            players=[],
            status="playing",
            current_turn_id=None
        )
        game_store.save_game(game)
        
        assert game_store.get_current_turn("game-1") is None
    
    def test_get_all_turns(self):
        """Test getting all turns for a game."""
        game_id = "game-1"
        
        turn1 = Turn(turn_id="turn-1", game_id=game_id, questioner_id="p1", phase="question")
        turn2 = Turn(turn_id="turn-2", game_id=game_id, questioner_id="p2", phase="question")
        
        game_store.save_turn(turn1)
        game_store.save_turn(turn2)
        
        all_turns = game_store.get_all_turns(game_id)
        assert len(all_turns) == 2
        assert all_turns[0].turn_id == "turn-1"
        assert all_turns[1].turn_id == "turn-2"
    
    def test_get_all_turns_empty(self):
        """Test getting turns for a game with no turns."""
        assert len(game_store.get_all_turns("nonexistent")) == 0
    
    def test_get_all_waiting_games(self):
        """Test getting all waiting games."""
        waiting_game = Game(
            game_id="waiting-1",
            game_name="waitinggame",
            players=[],
            status="waiting"
        )
        playing_game = Game(
            game_id="playing-1",
            game_name="playinggame",
            players=[],
            status="playing"
        )
        
        game_store.save_game(waiting_game)
        game_store.save_game(playing_game)
        
        waiting_games = game_store.get_all_waiting_games()
        assert len(waiting_games) == 1
        assert waiting_games[0].game_id == "waiting-1"

