"""Scenario 25: Undo Matrix (restore, restore --staged, reset --soft)."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario25(BaseScenario):
    id = "25"
    title = "後悔藥對照：restore / reset 三種模式"
    difficulty = "初階 ⭐⭐"
    story = (
        "一個下午同時犯了三個錯：改壞了檔案、把不該暫存的 debug 檔加進暫存區、太早 commit 了半成品。\n"
        "請使用現代 Git 後悔藥：\n"
        "1. git restore 放棄工作區修改\n"
        "2. git restore --staged 移出暫存區\n"
        "3. git reset --soft HEAD~1 撤銷提交但保留暫存區，重新整裝出發！"
    )
    goals = [
        "使用 git restore config.py 放棄工作區未暫存的修改",
        "使用 git restore --staged debug.log 取消暫存（檔案保留在硬碟）",
        "使用 git reset --soft HEAD~1 撤銷半成品 commit",
        "重新提交：git commit -m \"feat: complete feature correctly\""
    ]
    next_steps = [
        "還原工作區：git restore config.py",
        "取消暫存：git restore --staged debug.log",
        "軟撤銷提交：git reset --soft HEAD~1",
        "重新提交：git commit -m \"feat: complete payment feature\"",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "執行 git restore config.py 可以直接捨棄工作區修改。",
        "執行 git restore --staged debug.log 可以將 debug.log 移出暫存區。",
        "執行 git reset --soft HEAD~1 可以撤銷上次 commit 並保留修改於暫存區。",
        "重新 commit 後執行 ./git-lab verify 通關！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("config.py", "API_HOST = 'https://api.prod'\n", "feat: payment base")

        # wip commit
        engine.commit_file("payment.py", "def process(): pass\n", "wip: half done")

        # 1. Broken config.py in working tree
        engine.create_file("config.py", "API_HOST = 'BROKEN_URL'\n")

        # 2. Accidental debug.log staged
        engine.create_file("debug.log", "debug secret\n")
        engine.run_git("add", "debug.log")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # config.py should match HEAD
        code, diff_out, _ = engine.run_git("diff", "config.py", check=False)
        if diff_out.strip():
            return False, "config.py 仍有未復原的工作區修改！請執行 git restore config.py。"

        # debug.log should not be staged
        code, staged_out, _ = engine.run_git("diff", "--staged", "--name-only", check=False)
        if "debug.log" in staged_out:
            return False, "debug.log 仍在暫存區中！請執行 git restore --staged debug.log。"

        # debug.log should still exist on disk
        if not engine.file_exists("debug.log"):
            return False, "debug.log 檔案消失了！請確認使用 restore --staged（移出暫存而非刪除實體檔案）。"

        # Check commit history: no wip
        code, log_out, _ = engine.run_git("log", "-1", "--pretty=%s", check=False)
        if "wip" in log_out.lower():
            return False, "最新的 commit 依然是 wip！請執行 git reset --soft HEAD~1 重新 commit。"

        count = engine.get_commit_count()
        if count != 2:
            return False, f"預期倉庫內應有 2 個 commit（base + 重新提交的 feature），目前有 {count} 個。"

        return True, "太棒了！你完美駕馭了 restore、restore --staged 與 reset --soft 的現代後悔藥組合！"
