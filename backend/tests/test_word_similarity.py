"""
Tests for word_similarity module - word matching logic.
"""
import pytest
from unittest.mock import patch, MagicMock
import word_similarity


class TestWordSimilarity:
    """Test word similarity checking."""
    
    def test_exact_match(self):
        """Test that exact matches (case-insensitive) return True."""
        assert word_similarity.are_words_similar("dog", "dog") is True
        assert word_similarity.are_words_similar("Dog", "dog") is True
        assert word_similarity.are_words_similar("DOG", "dog") is True
    
    def test_different_words_no_api(self):
        """Test that different words return False when API is not available."""
        with patch.dict('os.environ', {}, clear=True):
            # No API key, should return False for non-exact matches
            assert word_similarity.are_words_similar("dog", "cat") is False
            assert word_similarity.are_words_similar("car", "automobile") is False
    
    def test_group_similar_words_exact_matches(self):
        """Test grouping words with exact matches."""
        words = {
            "player1": "dog",
            "player2": "dog",
            "player3": "cat",
            "player4": "cat"
        }
        
        groups = word_similarity.group_similar_words(words)
        
        # Should have 2 groups
        assert len(groups) == 2
        
        # Check that players with same word are grouped together
        dog_group = None
        cat_group = None
        for word, players in groups.items():
            if word == "dog":
                dog_group = players
            elif word == "cat":
                cat_group = players
        
        assert dog_group is not None
        assert cat_group is not None
        assert len(dog_group) == 2
        assert len(cat_group) == 2
        assert "player1" in dog_group
        assert "player2" in dog_group
        assert "player3" in cat_group
        assert "player4" in cat_group
    
    def test_group_similar_words_all_different(self):
        """Test grouping when all words are different."""
        words = {
            "player1": "dog",
            "player2": "cat",
            "player3": "bird",
            "player4": "fish"
        }
        
        groups = word_similarity.group_similar_words(words)
        
        # Each word should be in its own group
        assert len(groups) == 4
    
    def test_group_similar_words_all_same(self):
        """Test grouping when all words are the same."""
        words = {
            "player1": "dog",
            "player2": "dog",
            "player3": "dog",
            "player4": "dog"
        }
        
        groups = word_similarity.group_similar_words(words)
        
        # Should have 1 group with all players
        assert len(groups) == 1
        group_players = list(groups.values())[0]
        assert len(group_players) == 4
    
    def test_group_similar_words_empty(self):
        """Test grouping with empty input."""
        groups = word_similarity.group_similar_words({})
        assert len(groups) == 0
    
    @patch('builtins.__import__')
    def test_semantic_similarity_with_api(self, mock_import):
        """Test semantic similarity checking with mocked OpenAI API."""
        # Mock the openai module import
        mock_openai = MagicMock()
        mock_client = MagicMock()
        mock_openai.OpenAI.return_value = mock_client
        
        def import_side_effect(name, *args, **kwargs):
            if name == 'openai':
                return mock_openai
            return __import__(name, *args, **kwargs)
        
        mock_import.side_effect = import_side_effect
        
        # Mock API response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "YES"
        mock_client.chat.completions.create.return_value = mock_response
        
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            result = word_similarity.check_semantic_similarity("color", "colour")
            assert result is True
    
    @patch('builtins.__import__')
    def test_semantic_similarity_api_returns_no(self, mock_import):
        """Test semantic similarity when API returns NO."""
        mock_openai = MagicMock()
        mock_client = MagicMock()
        mock_openai.OpenAI.return_value = mock_client
        
        def import_side_effect(name, *args, **kwargs):
            if name == 'openai':
                return mock_openai
            return __import__(name, *args, **kwargs)
        
        mock_import.side_effect = import_side_effect
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "NO"
        mock_client.chat.completions.create.return_value = mock_response
        
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            result = word_similarity.check_semantic_similarity("dog", "cat")
            assert result is False
    
    @patch('builtins.__import__')
    def test_semantic_similarity_api_error(self, mock_import):
        """Test semantic similarity when API raises an error."""
        mock_openai = MagicMock()
        mock_client = MagicMock()
        mock_openai.OpenAI.return_value = mock_client
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        
        def import_side_effect(name, *args, **kwargs):
            if name == 'openai':
                return mock_openai
            return __import__(name, *args, **kwargs)
        
        mock_import.side_effect = import_side_effect
        
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            result = word_similarity.check_semantic_similarity("dog", "cat")
            assert result is False  # Should fall back to False on error

