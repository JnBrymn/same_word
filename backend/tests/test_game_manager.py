"""
Tests for game_manager module - core game logic tests.
"""
import pytest
from game_manager import (
    create_game, join_game, start_game, start_turn,
    submit_question, submit_answer, calculate_scores,
    complete_turn, check_game_end
)
from models import Game, Player, Turn
import game_store


class TestCreateGame:
    """Test game creation."""
    
    def test_create_game_success(self):
        """Test successful game creation."""
        game, player_id = create_game("testgame", "Alice")
        
        assert game is not None
        assert game.game_name == "testgame"
        assert game.status == "waiting"
        assert len(game.players) == 1
        assert game.players[0].name == "Alice"
        assert game.players[0].player_id == player_id
        assert game.players[0].is_creator is True
        assert game.creator_id == player_id
    
    def test_create_game_lowercase_enforcement(self):
        """Test that uppercase game name raises ValueError."""
        with pytest.raises(ValueError, match="Game name must be lowercase"):
            create_game("TestGame", "Alice")
    
    def test_create_game_duplicate_name(self):
        """Test that duplicate game names are rejected."""
        create_game("testgame", "Alice")
        
        with pytest.raises(ValueError, match="Game name already exists"):
            create_game("testgame", "Bob")
    
    def test_create_game_duplicate_name_case_insensitive(self):
        """Test that duplicate names are case-insensitive."""
        create_game("testgame", "Alice")
        
        # Try to create with uppercase - should fail lowercase check first
        with pytest.raises(ValueError, match="Game name must be lowercase"):
            create_game("TestGame", "Bob")
        
        # Try with lowercase but different case in existing - should work (case-insensitive lookup)
        # Actually, the lookup is case-insensitive but creation requires lowercase
        # So we need to use lowercase for the duplicate check
        with pytest.raises(ValueError, match="Game name already exists"):
            create_game("testgame", "Bob")
    
    def test_create_game_uppercase_name_raises_error(self):
        """Test that uppercase game name raises ValueError."""
        with pytest.raises(ValueError, match="Game name must be lowercase"):
            create_game("TESTGAME", "Alice")


class TestJoinGame:
    """Test joining games."""
    
    def test_join_game_success(self):
        """Test successful game join."""
        game, creator_id = create_game("testgame", "Alice")
        joined_game, player_id, error = join_game("testgame", "Bob")
        
        assert error is None
        assert joined_game is not None
        assert joined_game.game_id == game.game_id
        assert len(joined_game.players) == 2
        assert player_id is not None
        assert player_id != creator_id
    
    def test_join_game_not_found(self):
        """Test joining non-existent game."""
        _, _, error = join_game("nonexistent", "Bob")
        assert error == "Game not found"
    
    def test_join_game_not_waiting(self):
        """Test joining a game that's not in waiting status."""
        game, creator_id = create_game("testgame", "Alice")
        # Add more players and start game
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        
        _, _, error = join_game("testgame", "Diana")
        assert error == "Game is not accepting new players"
    
    def test_join_game_duplicate_player_name(self):
        """Test that duplicate player names are rejected."""
        create_game("testgame", "Alice")
        _, _, error = join_game("testgame", "Alice")
        assert error == "Player name already taken in this game"
    
    def test_join_game_duplicate_player_name_case_insensitive(self):
        """Test that duplicate player names are case-insensitive."""
        create_game("testgame", "Alice")
        _, _, error = join_game("testgame", "alice")
        assert error == "Player name already taken in this game"
    
    def test_join_game_lowercase_enforcement(self):
        """Test that uppercase game name raises ValueError."""
        create_game("testgame", "Alice")
        with pytest.raises(ValueError, match="Game name must be lowercase"):
            join_game("TestGame", "Bob")


class TestStartGame:
    """Test starting games."""
    
    def test_start_game_success(self):
        """Test successful game start."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        
        success, error = start_game(game.game_id, creator_id, 2)
        
        assert success is True
        assert error is None
        
        updated_game = game_store.get_game(game.game_id)
        assert updated_game.status == "playing"
        assert updated_game.rounds_per_player == 2
        assert updated_game.current_turn_index == 0
        assert updated_game.current_round == 0
    
    def test_start_game_not_creator(self):
        """Test that only creator can start game."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        
        success, error = start_game(game.game_id, player2_id, 2)
        
        assert success is False
        assert error == "Only the game creator can start the game"
    
    def test_start_game_not_waiting(self):
        """Test that game must be in waiting status."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        
        # Try to start again
        success, error = start_game(game.game_id, creator_id, 2)
        assert success is False
        assert error == "Game is not in waiting status"
    
    def test_start_game_insufficient_players(self):
        """Test that at least 3 players are required."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        # Only 2 players total
        
        success, error = start_game(game.game_id, creator_id, 2)
        
        assert success is False
        assert error == "At least 3 players are required to start the game"
    
    def test_start_game_invalid_rounds(self):
        """Test that rounds must be at least 1."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        
        success, error = start_game(game.game_id, creator_id, 0)
        
        assert success is False
        assert error == "Rounds per player must be at least 1"
    
    def test_start_game_not_found(self):
        """Test starting non-existent game."""
        success, error = start_game("nonexistent", "player-id", 2)
        assert success is False
        assert error == "Game not found"


class TestStartTurn:
    """Test starting turns."""
    
    def test_start_turn_success(self):
        """Test successful turn start."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        
        turn, error = start_turn(game.game_id)
        
        assert error is None
        assert turn is not None
        assert turn.phase == "question"
        assert turn.questioner_id == creator_id
        
        updated_game = game_store.get_game(game.game_id)
        assert updated_game.current_turn_id == turn.turn_id
    
    def test_start_turn_not_playing(self):
        """Test that game must be in playing status."""
        game, creator_id = create_game("testgame", "Alice")
        
        turn, error = start_turn(game.game_id)
        
        assert turn is None
        assert error == "Game is not in playing status"
    
    def test_start_turn_returns_existing_active_turn(self):
        """Test that starting a turn when one exists returns existing turn."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        
        turn1, _ = start_turn(game.game_id)
        turn2, _ = start_turn(game.game_id)
        
        assert turn1.turn_id == turn2.turn_id


class TestSubmitQuestion:
    """Test submitting questions."""
    
    def test_submit_question_success(self):
        """Test successful question submission."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        
        success, error = submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        assert success is True
        assert error is None
        
        turn = game_store.get_current_turn(game.game_id)
        assert turn.question == "What is your favorite animal?"
        assert turn.phase == "answer"
    
    def test_submit_question_wrong_player(self):
        """Test that only questioner can submit question."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        
        success, error = submit_question(game.game_id, player2_id, "What is your favorite animal?")
        
        assert success is False
        assert error == "It's not your turn to ask a question"
    
    def test_submit_question_empty(self):
        """Test that empty question is rejected."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        
        success, error = submit_question(game.game_id, creator_id, "")
        assert success is False
        assert error == "Question cannot be empty"
        
        success, error = submit_question(game.game_id, creator_id, "   ")
        assert success is False
        assert error == "Question cannot be empty"
    
    def test_submit_question_wrong_phase(self):
        """Test that question can only be submitted in question phase."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        # Try to submit another question in answer phase
        success, error = submit_question(game.game_id, creator_id, "Another question?")
        assert success is False
        assert error == "Turn is not in question phase"


class TestSubmitAnswer:
    """Test submitting answers."""
    
    def test_submit_answer_success(self):
        """Test successful answer submission."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        success, error = submit_answer(game.game_id, player2_id, "dog")
        
        assert success is True
        assert error is None
        
        turn = game_store.get_current_turn(game.game_id)
        assert turn.answers[player2_id] == "dog"
    
    def test_submit_answer_lowercase_normalization(self):
        """Test that answers are normalized to lowercase."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        submit_answer(game.game_id, player2_id, "DOG")
        
        turn = game_store.get_current_turn(game.game_id)
        assert turn.answers[player2_id] == "dog"
    
    def test_submit_answer_empty(self):
        """Test that empty answer is rejected."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        success, error = submit_answer(game.game_id, player2_id, "")
        assert success is False
        assert error == "Answer cannot be empty"
    
    def test_submit_answer_multiple_words(self):
        """Test that multiple words are rejected."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        success, error = submit_answer(game.game_id, player2_id, "dog cat")
        assert success is False
        assert error == "Answer must be a single word"
    
    def test_submit_answer_duplicate(self):
        """Test that duplicate answers are rejected."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        submit_answer(game.game_id, player2_id, "dog")
        success, error = submit_answer(game.game_id, player2_id, "cat")
        
        assert success is False
        assert error == "You have already submitted an answer"
    
    def test_submit_answer_auto_complete(self):
        """Test that turn completes when all players answer."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        turn_id = game_store.get_current_turn(game.game_id).turn_id
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        # All players answer
        submit_answer(game.game_id, creator_id, "dog")
        submit_answer(game.game_id, player2_id, "cat")
        submit_answer(game.game_id, player3_id, "bird")
        
        # Turn should be complete (get from all_turns since current_turn_id is cleared)
        all_turns = game_store.get_all_turns(game.game_id)
        completed_turn = next(t for t in all_turns if t.turn_id == turn_id)
        assert completed_turn.is_complete is True
        assert completed_turn.phase == "scoring"
        assert len(completed_turn.scores) == 3


class TestCalculateScores:
    """Test score calculation."""
    
    def test_calculate_scores_dud_all_different(self):
        """Test dud question when all answers are different."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        
        turn = Turn(
            turn_id="turn-1",
            game_id=game.game_id,
            questioner_id=creator_id,
            phase="answer"
        )
        turn.answers = {
            creator_id: "dog",
            player2_id: "cat",
            player3_id: "bird"
        }
        
        scores = calculate_scores(turn, game)
        
        # Questioner loses 1 point, others get 0
        assert scores[creator_id] == -1
        assert scores[player2_id] == 0
        assert scores[player3_id] == 0
    
    def test_calculate_scores_dud_all_same(self):
        """Test dud question when all answers are the same."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        
        turn = Turn(
            turn_id="turn-1",
            game_id=game.game_id,
            questioner_id=creator_id,
            phase="answer"
        )
        turn.answers = {
            creator_id: "dog",
            player2_id: "dog",
            player3_id: "dog"
        }
        
        scores = calculate_scores(turn, game)
        
        # Questioner loses 1 point, others get 0
        assert scores[creator_id] == -1
        assert scores[player2_id] == 0
        assert scores[player3_id] == 0
    
    def test_calculate_scores_normal_match(self):
        """Test normal scoring with matches."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        
        turn = Turn(
            turn_id="turn-1",
            game_id=game.game_id,
            questioner_id=creator_id,
            phase="answer"
        )
        # Two players match, one doesn't
        turn.answers = {
            creator_id: "dog",
            player2_id: "dog",
            player3_id: "cat"
        }
        
        scores = calculate_scores(turn, game)
        
        # Creator and player2 match: each gets 1 point (1 match)
        # Player3 has no matches: 0 points
        assert scores[creator_id] == 1
        assert scores[player2_id] == 2  # 1 match + 1 bonus for matching questioner
        assert scores[player3_id] == 0
    
    def test_calculate_scores_multiple_matches(self):
        """Test scoring with multiple matching groups."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        _, player4_id, _ = join_game("testgame", "Diana")
        
        turn = Turn(
            turn_id="turn-1",
            game_id=game.game_id,
            questioner_id=creator_id,
            phase="answer"
        )
        # Two groups: dog (creator, player2) and cat (player3, player4)
        turn.answers = {
            creator_id: "dog",
            player2_id: "dog",
            player3_id: "cat",
            player4_id: "cat"
        }
        
        scores = calculate_scores(turn, game)
        
        # Creator matches with player2: 1 point
        # Player2 matches with creator: 1 point + 1 bonus = 2 points
        # Player3 matches with player4: 1 point
        # Player4 matches with player3: 1 point
        assert scores[creator_id] == 1
        assert scores[player2_id] == 2
        assert scores[player3_id] == 1
        assert scores[player4_id] == 1


class TestCompleteTurn:
    """Test completing turns."""
    
    def test_complete_turn_success(self):
        """Test successful turn completion."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        start_turn(game.game_id)
        turn_id = game_store.get_current_turn(game.game_id).turn_id
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        submit_answer(game.game_id, creator_id, "dog")
        submit_answer(game.game_id, player2_id, "cat")
        submit_answer(game.game_id, player3_id, "bird")
        
        # Turn should already be complete from submit_answer
        # But let's test complete_turn directly
        # Get turn from all_turns since current_turn_id might be cleared
        all_turns = game_store.get_all_turns(game.game_id)
        turn = next(t for t in all_turns if t.turn_id == turn_id)
        turn.is_complete = False  # Reset to test complete_turn
        turn.phase = "answer"  # Reset phase
        game = game_store.get_game(game.game_id)
        game.current_turn_id = turn_id  # Restore for complete_turn
        game.current_turn_index = 0  # Reset turn index since it was already incremented
        game_store.save_game(game)
        game_store.save_turn(turn)
        
        success, error = complete_turn(game.game_id)
        
        assert success is True
        assert error is None
        
        updated_game = game_store.get_game(game.game_id)
        assert updated_game.current_turn_index == 1  # Moved to next player
        assert updated_game.current_round == 0
        assert updated_game.current_turn_id is None  # Cleared for next turn
    
    def test_complete_turn_round_advancement(self):
        """Test that round advances when all players have had a turn."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        
        # Complete first turn (creator's turn)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "Q1")
        submit_answer(game.game_id, creator_id, "a")
        submit_answer(game.game_id, player2_id, "b")
        submit_answer(game.game_id, player3_id, "c")
        
        # Complete second turn (player2's turn)
        start_turn(game.game_id)
        submit_question(game.game_id, player2_id, "Q2")
        submit_answer(game.game_id, creator_id, "a")
        submit_answer(game.game_id, player2_id, "b")
        submit_answer(game.game_id, player3_id, "c")
        
        # Complete third turn (player3's turn) - should advance round
        start_turn(game.game_id)
        submit_question(game.game_id, player3_id, "Q3")
        submit_answer(game.game_id, creator_id, "a")
        submit_answer(game.game_id, player2_id, "b")
        submit_answer(game.game_id, player3_id, "c")
        
        updated_game = game_store.get_game(game.game_id)
        assert updated_game.current_round == 1
        assert updated_game.current_turn_index == 0  # Back to first player
    
    def test_complete_turn_game_end(self):
        """Test that game ends when rounds are complete."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        _, player3_id, _ = join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)  # 1 round per player
        
        # Complete all 3 turns (one round)
        for _ in range(3):
            start_turn(game.game_id)
            questioner_id = game.players[game.current_turn_index].player_id
            submit_question(game.game_id, questioner_id, "Q")
            submit_answer(game.game_id, creator_id, "a")
            submit_answer(game.game_id, player2_id, "b")
            submit_answer(game.game_id, player3_id, "c")
        
        updated_game = game_store.get_game(game.game_id)
        assert updated_game.status == "finished"


class TestCheckGameEnd:
    """Test game end detection."""
    
    def test_check_game_end_not_finished(self):
        """Test that game is not finished when rounds incomplete."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 2)
        
        assert check_game_end(game) is False
    
    def test_check_game_end_finished(self):
        """Test that game is finished when rounds complete."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        game.current_round = 1  # Set to completed rounds
        
        assert check_game_end(game) is True
    
    def test_check_game_end_already_finished(self):
        """Test that already finished game returns True."""
        game, creator_id = create_game("testgame", "Alice")
        game.status = "finished"
        
        assert check_game_end(game) is True

