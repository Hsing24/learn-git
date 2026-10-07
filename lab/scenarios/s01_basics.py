"""Scenario 01: Working Directory, Staging, and First Commit."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario01(BaseScenario):
    id = "01"
    title = "工作區、暫存區與第一個 Commit"
    difficulty = "入門 ⭐"
    story = (
        "你剛接手「便當快點」專案，系統已經為你準備好初始檔案：menu.txt 與主程式 app.py。\n"
        "身為工程師，你的第一個任務是將這些原始碼納入 Git 版本控制，建立專案的第一個里程碑 (Commit)！"
    )
    goals = [
        "使用 git status 查看工作區的 Untracked（未追蹤）檔案",
        "使用 git add 將 menu.txt 與 app.py 加入 Staging Area（暫存區）",
        "使用 git commit -m \"...\" 完成你的第一個版本提交",
        "確認工作區處於 clean（乾淨）狀態"
    ]
    next_steps = [
        "終端機輸入：git status",
        "終端機輸入：git add .",
        "終端機輸入：git commit -m \"feat: initial commit for bento app\"",
        "完成後執行：./git-lab verify"
    ]
    hints = [
        "先輸入 git status 觀察終端機提示，你會看到紅色的 untracked files。",
        "輸入 git add . 可以將目前目錄下的所有新檔案一口氣加入暫存區（再度輸入 git status 會變成綠色）。",
        "輸入 git commit -m \"feat: 初始提交\" 建立版本。完成後執行 ./git-lab verify 即可通關！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.create_file("menu.txt", "=== 今日便當菜單 ===\n1. 排骨便當 $100\n2. 雞腿便當 $110\n3. 招牌便當 $90\n")
        engine.create_file("app.py", "#!/usr/bin/env python3\nprint('便當快點系統啟動中...')\nwith open('menu.txt', 'r', encoding='utf-8') as f:\n    print(f.read())\n")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check commit count
        count = engine.get_commit_count()
        if count == 0:
            return False, "倉庫內目前還沒有任何 Commit，請先使用 git commit 完成提交。"

        # Check if files are tracked in HEAD
        code, out, _ = engine.run_git("ls-tree", "-r", "--name-only", "HEAD", check=False)
        tracked_files = [line.strip() for line in out.splitlines()]
        if "menu.txt" not in tracked_files or "app.py" not in tracked_files:
            return False, "第一個 Commit 必須包含 menu.txt 與 app.py 兩個檔案。"

        # Check porcelain status (working tree should be clean of menu.txt and app.py)
        code, status_out, _ = engine.run_git("status", "--porcelain", check=False)
        dirty_lines = [l for l in status_out.splitlines() if "menu.txt" in l or "app.py" in l]
        if dirty_lines:
            return False, "工作區尚未完全提交乾淨，請確認檔案皆已加入暫存區並 commit。"

        return True, "恭喜！你成功掌握了 git add 與 git commit，建立了第一個版本節點！"
