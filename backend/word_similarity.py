"""
Word similarity checking for matching answers that are "close enough".
Uses string similarity and optionally AI for semantic matching.
"""
from typing import List, Dict, Set
from difflib import SequenceMatcher
import os


def string_similarity(word1: str, word2: str) -> float:
    """
    Calculate string similarity between two words (0.0 to 1.0).
    Uses SequenceMatcher for fuzzy matching.
    """
    return SequenceMatcher(None, word1.lower(), word2.lower()).ratio()


def are_words_similar(word1: str, word2: str, threshold: float = 0.85) -> bool:
    """
    Check if two words are similar enough to be considered a match.
    
    Args:
        word1: First word
        word2: Second word
        threshold: Similarity threshold (0.0 to 1.0). Default 0.85 means 85% similar.
    
    Returns:
        True if words are similar enough, False otherwise
    """
    # Exact match (case-insensitive)
    if word1.lower() == word2.lower():
        return True
    
    # Check string similarity
    similarity = string_similarity(word1, word2)
    if similarity >= threshold:
        return True
    
    # Check with AI if available
    return check_semantic_similarity(word1, word2)


def check_semantic_similarity(word1: str, word2: str) -> bool:
    """
    Use AI to check if words are semantically similar.
    Falls back to False if AI is not available.
    """
    # Check if OpenAI API key is available
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        return False
    
    try:
        import openai
        
        client = openai.OpenAI(api_key=openai_api_key)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a word similarity checker. Determine if two single words are similar enough to be considered the same answer in a word game. Consider:\n- Spelling variations (color/colour, theater/theatre)\n- Plural/singular forms (dog/dogs)\n- Common synonyms (car/automobile, dog/puppy)\n- Different forms of the same word (run/running)\n\nRespond with only 'YES' or 'NO'."
                },
                {
                    "role": "user",
                    "content": f"Are '{word1}' and '{word2}' similar enough to be considered the same answer? Answer YES or NO only."
                }
            ],
            temperature=0.1,
            max_tokens=10
        )
        
        answer = response.choices[0].message.content.strip().upper()
        return answer == "YES"
    except Exception as e:
        # If AI check fails, fall back to False
        print(f"AI similarity check failed: {e}")
        return False


def group_similar_words(words: Dict[str, str]) -> Dict[str, List[str]]:
    """
    Group words that are similar enough to be considered matches.
    
    Args:
        words: Dictionary mapping player_id -> word
    
    Returns:
        Dictionary mapping canonical_word -> list of player_ids
    """
    if not words:
        return {}
    
    groups: Dict[str, List[str]] = {}
    processed: Set[str] = set()
    
    # Create a list of (player_id, word) pairs
    word_list = list(words.items())
    
    for player_id, word in word_list:
        if player_id in processed:
            continue
        
        # Find or create a group for this word
        canonical_word = word
        group_found = False
        
        # Check if this word is similar to any existing group
        for existing_canonical, player_ids in groups.items():
            if are_words_similar(word, existing_canonical):
                # Add to existing group
                groups[existing_canonical].append(player_id)
                processed.add(player_id)
                group_found = True
                break
        
        # If no similar group found, create a new group
        if not group_found:
            groups[canonical_word] = [player_id]
            processed.add(player_id)
    
    return groups

