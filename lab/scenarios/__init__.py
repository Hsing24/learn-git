"""Scenario registry and aliases."""

from typing import Dict, List, Optional
from lab.base import BaseScenario
from lab.scenarios.s00_config import Scenario00
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
from lab.scenarios.s11_hooks import Scenario11
from lab.scenarios.s12_patch import Scenario12
from lab.scenarios.s13_gitignore import Scenario13
from lab.scenarios.s14_revert_merge import Scenario14
from lab.scenarios.s15_tags import Scenario15
from lab.scenarios.s16_archaeology import Scenario16
from lab.scenarios.s17_rerere import Scenario17
from lab.scenarios.s18_amend import Scenario18
from lab.scenarios.s19_stash import Scenario19
from lab.scenarios.s20_mv_clean import Scenario20
from lab.scenarios.s21_remote_fetch import Scenario21
from lab.scenarios.s22_accidental_commit import Scenario22
from lab.scenarios.s23_plumbing import Scenario23

SCENARIOS: List[BaseScenario] = [
    Scenario00(),
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
    Scenario11(),
    Scenario12(),
    Scenario13(),
    Scenario14(),
    Scenario15(),
    Scenario16(),
    Scenario17(),
    Scenario18(),
    Scenario19(),
    Scenario20(),
    Scenario21(),
    Scenario22(),
    Scenario23(),
]

SCENARIO_MAP: Dict[str, BaseScenario] = {s.id: s for s in SCENARIOS}

ALIASES = {
    "0": "00",
    "00": "00",
    "config": "00",
    "setup": "00",
    "ssh": "00",
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
    "11": "11",
    "hook": "11",
    "hooks": "11",
    "precommit": "11",
    "pre-commit": "11",
    "12": "12",
    "patch": "12",
    "add-p": "12",
    "13": "13",
    "ignore": "13",
    "gitignore": "13",
    "rm-cached": "13",
    "14": "14",
    "revert": "14",
    "revert-merge": "14",
    "rollback": "14",
    "15": "15",
    "tag": "15",
    "tags": "15",
    "release": "15",
    "16": "16",
    "archaeology": "16",
    "pickaxe": "16",
    "blame": "16",
    "17": "17",
    "rerere": "17",
    "18": "18",
    "amend": "18",
    "commit-amend": "18",
    "19": "19",
    "stash": "19",
    "pop": "19",
    "20": "20",
    "mv": "20",
    "clean": "20",
    "rename": "20",
    "21": "21",
    "fetch": "21",
    "upstream": "21",
    "22": "22",
    "accidental": "22",
    "rescue-commit": "22",
    "23": "23",
    "plumbing": "23",
    "cat-file": "23",
}

def get_scenario(key: str) -> Optional[BaseScenario]:
    norm = key.strip().lower()
    if norm in SCENARIO_MAP:
        return SCENARIO_MAP[norm]
    if norm in ALIASES:
        return SCENARIO_MAP[ALIASES[norm]]
    return None
