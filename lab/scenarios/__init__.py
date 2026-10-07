"""Scenario registry and aliases."""

from typing import Dict, List, Optional
from lab.base import BaseScenario
from lab.scenarios.s01_basics import Scenario01
from lab.scenarios.s02_branching import Scenario02
from lab.scenarios.s03_merge_conflict import Scenario03
from lab.scenarios.s04_rebase_linear import Scenario04
from lab.scenarios.s05_rebase_interactive import Scenario05
from lab.scenarios.s06_mock_remote import Scenario06
from lab.scenarios.s07_cherry_pick import Scenario07
from lab.scenarios.s08_reflog_rescue import Scenario08
from lab.scenarios.s09_worktree import Scenario09
from lab.scenarios.s10_bisect import Scenario10

SCENARIOS: List[BaseScenario] = [
    Scenario01(),
    Scenario02(),
    Scenario03(),
    Scenario04(),
    Scenario05(),
    Scenario06(),
    Scenario07(),
    Scenario08(),
    Scenario09(),
    Scenario10(),
]

SCENARIO_MAP: Dict[str, BaseScenario] = {s.id: s for s in SCENARIOS}

ALIASES = {
    "1": "01",
    "basics": "01",
    "2": "02",
    "branch": "02",
    "branching": "02",
    "3": "03",
    "conflict": "03",
    "merge": "03",
    "4": "04",
    "rebase": "04",
    "linear": "04",
    "5": "05",
    "squash": "05",
    "interactive": "05",
    "6": "06",
    "remote": "06",
    "push": "06",
    "7": "07",
    "cherry": "07",
    "cherry-pick": "07",
    "cherrypick": "07",
    "8": "08",
    "reflog": "08",
    "rescue": "08",
    "9": "09",
    "worktree": "09",
    "tree-work": "09",
    "10": "10",
    "bisect": "10",
    "debug": "10",
}

def get_scenario(key: str) -> Optional[BaseScenario]:
    norm = key.strip().lower()
    if norm in SCENARIO_MAP:
        return SCENARIO_MAP[norm]
    if norm in ALIASES:
        return SCENARIO_MAP[ALIASES[norm]]
    return None
