"""Base class and protocol for scenarios."""

from abc import ABC, abstractmethod
from typing import List, Tuple

class BaseScenario(ABC):
    id: str = ""
    title: str = ""
    difficulty: str = ""
    story: str = ""
    goals: List[str] = []
    next_steps: List[str] = []
    hints: List[str] = []

    @abstractmethod
    def setup(self, engine) -> None:
        """Set up the git workspace, commit history, branches, or conflicts."""
        pass

    @abstractmethod
    def verify(self, engine) -> Tuple[bool, str]:
        """Verify if the user has achieved the goals. Returns (success, feedback_message)."""
        pass
