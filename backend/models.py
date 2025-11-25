from dataclasses import dataclass, field
from typing import Optional
import uuid


@dataclass
class Player:
    name: str
    player_id: str
    score: int = 0
    is_creator: bool = False

    def __post_init__(self):
        if not self.player_id:
            self.player_id = str(uuid.uuid4())


@dataclass
class Turn:
    turn_id: str
    game_id: str
    questioner_id: str
    question: Optional[str] = None
    answers: dict[str, str] = field(default_factory=dict)  # player_id -> word (lowercase)
    scores: dict[str, int] = field(default_factory=dict)  # player_id -> points
    is_complete: bool = False
    phase: str = "question"  # question, answer, scoring
    typing_players: dict[str, float] = field(default_factory=dict)  # player_id -> timestamp of last typing activity

    def __post_init__(self):
        if not self.turn_id:
            self.turn_id = str(uuid.uuid4())


@dataclass
class Game:
    game_id: str
    game_name: str  # stored in lowercase
    players: list[Player] = field(default_factory=list)
    creator_id: Optional[str] = None
    status: str = "waiting"  # waiting, playing, finished
    rounds_per_player: Optional[int] = None
    current_turn_index: Optional[int] = None
    current_round: int = 0
    current_turn_id: Optional[str] = None

    def __post_init__(self):
        if not self.game_id:
            self.game_id = str(uuid.uuid4())

