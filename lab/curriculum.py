"""Curriculum loader for Git Scenario Lab."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

CURRICULUM_PATH = Path(__file__).resolve().parent.parent / "docs" / "curriculum.js"

_cached_curriculum: Optional[Dict[str, Any]] = None

def get_curriculum() -> Dict[str, Any]:
    """Parse and return the curriculum JSON from docs/curriculum.js."""
    global _cached_curriculum
    if _cached_curriculum is not None:
        return _cached_curriculum

    if not CURRICULUM_PATH.exists():
        raise FileNotFoundError(f"Curriculum file not found: {CURRICULUM_PATH}")

    content = CURRICULUM_PATH.read_text(encoding="utf-8").strip()
    # Strip prefix 'window.CURRICULUM =' and trailing ';'
    if content.startswith("window.CURRICULUM"):
        content = content.split("=", 1)[1].strip()
    if content.endswith(";"):
        content = content[:-1].strip()

    _cached_curriculum = json.loads(content)
    return _cached_curriculum

def get_ordered_level_items() -> List[Dict[str, Any]]:
    """Return flat list of all level definitions ordered by chapters."""
    curr = get_curriculum()
    items = []
    for ch_idx, ch in enumerate(curr.get("chapters", [])):
        ch_key = ch.get("key", f"ch{ch_idx}")
        ch_title = ch.get("title", "")
        ch_summary = ch.get("summary", "")
        levels = ch.get("levels", [])
        for l_idx, lvl in enumerate(levels, 1):
            disp = f"{ch_idx}-{l_idx}"
            item = dict(lvl)
            item["chapterKey"] = ch_key
            item["chapterTitle"] = ch_title
            item["chapterSummary"] = ch_summary
            item["displayNum"] = disp
            items.append(item)

    for opt_idx, opt in enumerate(curr.get("optional", []), 1):
        item = dict(opt)
        item["chapterKey"] = "optional"
        item["chapterTitle"] = "選修主題"
        item["chapterSummary"] = "特定進階議題（選修實戰）"
        item["displayNum"] = f"選修-{opt_idx}"
        items.append(item)

    return items
