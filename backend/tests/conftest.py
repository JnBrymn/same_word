"""
Pytest fixtures for backend tests.
"""
import pytest
from starlette.testclient import TestClient
from main import app
import game_store


@pytest.fixture(autouse=True)
def reset_store():
    """Reset the game store before each test to ensure isolation."""
    # Clear all games and turns
    game_store.games.clear()
    game_store.games_by_name.clear()
    game_store.turns.clear()
    game_store.turns_by_game.clear()
    yield
    # Cleanup after test (though autouse=True means this runs before each test)
    game_store.games.clear()
    game_store.games_by_name.clear()
    game_store.turns.clear()
    game_store.turns_by_game.clear()


@pytest.fixture
def client():
    """Create a test client for FastAPI."""
    return TestClient(app)


@pytest.fixture
def sample_game_name():
    """Sample game name for testing."""
    return "testgame"


@pytest.fixture
def sample_player_names():
    """Sample player names for testing."""
    return ["Alice", "Bob", "Charlie", "Diana"]

