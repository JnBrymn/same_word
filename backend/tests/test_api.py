"""
Tests for API endpoints - integration tests.
"""
import pytest
from fastapi.testclient import TestClient
from game_manager import create_game, join_game, start_game, start_turn, submit_question, submit_answer
import game_store


class TestPing:
    """Test ping endpoint."""
    
    def test_ping(self, client):
        """Test health check endpoint."""
        response = client.get("/ping")
        assert response.status_code == 200
        assert response.json() == {"message": "Pong"}


class TestListGames:
    """Test list games endpoint."""
    
    def test_list_games_empty(self, client):
        """Test listing games when none exist."""
        response = client.get("/api/games")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_games_only_waiting(self, client):
        """Test that only waiting games are returned."""
        create_game("waiting1", "Alice")
        create_game("waiting2", "Bob")
        game, _ = create_game("playing1", "Charlie")
        join_game("playing1", "Diana")
        join_game("playing1", "Eve")
        start_game(game.game_id, game.creator_id, 1)
        
        response = client.get("/api/games")
        assert response.status_code == 200
        games = response.json()
        assert len(games) == 2
        game_names = [g["game_name"] for g in games]
        assert "waiting1" in game_names
        assert "waiting2" in game_names
        assert "playing1" not in game_names
    
    def test_list_games_sorted(self, client):
        """Test that games are sorted alphabetically."""
        create_game("zebra", "Alice")
        create_game("alpha", "Bob")
        create_game("beta", "Charlie")
        
        response = client.get("/api/games")
        assert response.status_code == 200
        games = response.json()
        assert games[0]["game_name"] == "alpha"
        assert games[1]["game_name"] == "beta"
        assert games[2]["game_name"] == "zebra"
    
    def test_list_games_player_count(self, client):
        """Test that player count is correct."""
        create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        
        response = client.get("/api/games")
        assert response.status_code == 200
        games = response.json()
        test_game = next(g for g in games if g["game_name"] == "testgame")
        assert test_game["player_count"] == 3


class TestCreateGame:
    """Test create game endpoint."""
    
    def test_create_game_success(self, client):
        """Test successful game creation."""
        response = client.post("/api/games/create", json={
            "game_name": "testgame",
            "player_name": "Alice"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "game_id" in data
        assert "player_id" in data
    
    def test_create_game_uppercase_rejected(self, client):
        """Test that uppercase game names are rejected."""
        response = client.post("/api/games/create", json={
            "game_name": "TestGame",
            "player_name": "Alice"
        })
        
        assert response.status_code == 400
        assert "lowercase" in response.json()["detail"].lower()
    
    def test_create_game_empty_name(self, client):
        """Test that empty game name is rejected."""
        response = client.post("/api/games/create", json={
            "game_name": "",
            "player_name": "Alice"
        })
        
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    
    def test_create_game_empty_player_name(self, client):
        """Test that empty player name is rejected."""
        response = client.post("/api/games/create", json={
            "game_name": "testgame",
            "player_name": ""
        })
        
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    
    def test_create_game_duplicate_name(self, client):
        """Test that duplicate game names are rejected."""
        client.post("/api/games/create", json={
            "game_name": "testgame",
            "player_name": "Alice"
        })
        
        response = client.post("/api/games/create", json={
            "game_name": "testgame",
            "player_name": "Bob"
        })
        
        assert response.status_code == 400


class TestJoinGame:
    """Test join game endpoint."""
    
    def test_join_game_success(self, client):
        """Test successful game join."""
        create_game("testgame", "Alice")
        
        response = client.post("/api/games/join", json={
            "game_name": "testgame",
            "player_name": "Bob"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "game_id" in data
        assert "player_id" in data
    
    def test_join_game_not_found(self, client):
        """Test joining non-existent game."""
        response = client.post("/api/games/join", json={
            "game_name": "nonexistent",
            "player_name": "Bob"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "error" in data
        assert "not found" in data["error"].lower()
    
    def test_join_game_duplicate_player(self, client):
        """Test joining with duplicate player name."""
        create_game("testgame", "Alice")
        
        response = client.post("/api/games/join", json={
            "game_name": "testgame",
            "player_name": "Alice"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "already taken" in data["error"].lower()
    
    def test_join_game_uppercase_rejected(self, client):
        """Test that uppercase game names are rejected."""
        response = client.post("/api/games/join", json={
            "game_name": "TestGame",
            "player_name": "Bob"
        })
        
        assert response.status_code == 400


class TestGetGameState:
    """Test get game state endpoint."""
    
    def test_get_game_state_success(self, client):
        """Test successful game state retrieval."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        
        response = client.get(f"/api/games/{game.game_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["game_id"] == game.game_id
        assert data["game_name"] == "testgame"
        assert data["status"] == "waiting"
        assert len(data["players"]) == 2
        assert data["creator_id"] == creator_id
    
    def test_get_game_state_not_found(self, client):
        """Test getting state of non-existent game."""
        response = client.get("/api/games/nonexistent")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_game_state_with_turn(self, client):
        """Test game state includes turn information."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        response = client.get(f"/api/games/{game.game_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["current_turn"] is not None
        assert data["current_turn"]["phase"] == "answer"
        assert data["current_turn"]["question"] == "What is your favorite animal?"
    
    def test_get_game_state_answer_visibility(self, client):
        """Test that answers are only shown in scoring phase."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        submit_answer(game.game_id, creator_id, "dog")
        submit_answer(game.game_id, player2_id, "cat")
        
        # During answer phase, should show "answered" but not the word
        response = client.get(f"/api/games/{game.game_id}")
        data = response.json()
        answers = data["current_turn"]["answers"]
        assert answers is not None
        # Should show that players have answered, but not the words yet
        
        # Complete the turn
        submit_answer(game.game_id, game.players[2].player_id, "bird")
        
        # Now in scoring phase, should show actual words
        response = client.get(f"/api/games/{game.game_id}")
        data = response.json()
        # Find the completed turn
        completed_turn = next(t for t in data["all_turns"] if t["is_complete"])
        assert completed_turn["answers"] is not None
        # Should have actual words, not just "answered"


class TestStartGame:
    """Test start game endpoint."""
    
    def test_start_game_success(self, client):
        """Test successful game start."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        
        response = client.post(f"/api/games/{game.game_id}/start", json={
            "player_id": creator_id,
            "rounds_per_player": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_start_game_not_creator(self, client):
        """Test that only creator can start game."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        
        response = client.post(f"/api/games/{game.game_id}/start", json={
            "player_id": player2_id,
            "rounds_per_player": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "creator" in data["error"].lower()
    
    def test_start_game_insufficient_players(self, client):
        """Test that at least 3 players are required."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        
        response = client.post(f"/api/games/{game.game_id}/start", json={
            "player_id": creator_id,
            "rounds_per_player": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "3 players" in data["error"].lower()


class TestStartTurn:
    """Test start turn endpoint."""
    
    def test_start_turn_success(self, client):
        """Test successful turn start."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        
        response = client.post(f"/api/games/{game.game_id}/start-turn", json={})
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_start_turn_not_playing(self, client):
        """Test that game must be in playing status."""
        game, creator_id = create_game("testgame", "Alice")
        
        response = client.post(f"/api/games/{game.game_id}/start-turn", json={})
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False


class TestSubmitQuestion:
    """Test submit question endpoint."""
    
    def test_submit_question_success(self, client):
        """Test successful question submission."""
        game, creator_id = create_game("testgame", "Alice")
        join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        
        response = client.post(f"/api/games/{game.game_id}/question", json={
            "player_id": creator_id,
            "question": "What is your favorite animal?"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_submit_question_wrong_player(self, client):
        """Test that only questioner can submit question."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        
        response = client.post(f"/api/games/{game.game_id}/question", json={
            "player_id": player2_id,
            "question": "What is your favorite animal?"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "not your turn" in data["error"].lower()


class TestSubmitAnswer:
    """Test submit answer endpoint."""
    
    def test_submit_answer_success(self, client):
        """Test successful answer submission."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        response = client.post(f"/api/games/{game.game_id}/answer", json={
            "player_id": player2_id,
            "word": "dog"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_submit_answer_multiple_words(self, client):
        """Test that multiple words are rejected."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        response = client.post(f"/api/games/{game.game_id}/answer", json={
            "player_id": player2_id,
            "word": "dog cat"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "single word" in data["error"].lower()


class TestTypingIndicator:
    """Test typing indicator endpoint."""
    
    def test_update_typing_success(self, client):
        """Test successful typing indicator update."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        submit_question(game.game_id, creator_id, "What is your favorite animal?")
        
        response = client.post(f"/api/games/{game.game_id}/typing", json={
            "player_id": player2_id
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_update_typing_no_active_turn(self, client):
        """Test typing indicator when no active turn."""
        game, creator_id = create_game("testgame", "Alice")
        
        response = client.post(f"/api/games/{game.game_id}/typing", json={
            "player_id": creator_id
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "no active turn" in data["error"].lower()
    
    def test_update_typing_wrong_phase(self, client):
        """Test typing indicator in wrong phase."""
        game, creator_id = create_game("testgame", "Alice")
        _, player2_id, _ = join_game("testgame", "Bob")
        join_game("testgame", "Charlie")
        start_game(game.game_id, creator_id, 1)
        start_turn(game.game_id)
        # Still in question phase
        
        response = client.post(f"/api/games/{game.game_id}/typing", json={
            "player_id": player2_id
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "answer phase" in data["error"].lower()

