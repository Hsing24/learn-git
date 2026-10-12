"""Scenario 24: Inspect Changes (status, diff, diff --staged, log, show)."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario24(BaseScenario):
    id = "24"
    title = "看懂變更：status / diff / log / show"
    difficulty = "入門 ⭐"
    story = (
        "接手同事的半成品，工作區有改過的檔案、也有已暫存的檔案。\n"
        "commit 前，先搞清楚「改了什麼、哪些已經暫存、歷史長怎樣」。\n"
        "請在終端機練習各項檢視指令，並在 ANSWER.txt 寫入 utils.js 是 staged 還是 unstaged！"
    )
    goals = [
        "使用 git status -s 檢視精簡狀態與雙欄標記",
        "使用 git diff 檢視工作區變更",
        "使用 git diff --staged 檢視暫存區變更",
        "使用 git log --oneline --graph 檢視歷史樹",
        "使用 git show HEAD~1 檢視前一次提交",
        "在 ANSWER.txt 寫入 'staged' 回答檢驗"
    ]
    next_steps = [
        "檢視狀態：git status -s",
        "檢視工作區差異：git diff",
        "檢視暫存區差異：git diff --staged",
        "檢視拓撲：git log --oneline --graph",
        "檢視前次提交：git show HEAD~1",
        "寫入答案：echo 'staged' > ANSWER.txt",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "輸入 git diff 可以看到 app.js 的未暫存修改。",
        "輸入 git diff --staged 可以看到 utils.js 已經暫存的修改。",
        "輸入 git show HEAD~1 可以看到上一筆提交的完整內容。",
        "最後在 workspace 目錄中執行 echo 'staged' > ANSWER.txt 即可完成驗收！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 3 base commits
        engine.commit_file("app.py", "print('init')\n", "feat: project init")
        engine.commit_file("utils.py", "def add(a, b): return a + b\n", "feat: add helper")
        engine.commit_file("app.py", "print('ready')\n", "feat: update main logic")

        # Staged change in utils.py
        engine.create_file("utils.py", "def add(a, b): return a + b\ndef sub(a, b): return a - b\n")
        engine.run_git("add", "utils.py")

        # Unstaged change in app.py
        engine.create_file("app.py", "print('ready')\nprint('wip')\n")

        # Untracked notes.txt
        engine.create_file("notes.txt", "TODO: tests\n")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        ans_file = engine.workspace / "ANSWER.txt"
        if not ans_file.exists():
            return False, "尚未建立 ANSWER.txt！請觀察 utils.js 是已暫存還是未暫存，並執行 echo 'staged' > ANSWER.txt。"

        content = ans_file.read_text(encoding="utf-8").strip().lower()
        if "staged" not in content:
            return False, f"ANSWER.txt 的內容為 '{content}'，答案不正確。utils.js 在暫存區中，請填寫 'staged'。"

        return True, "恭喜！你完整掌握了 status、diff、diff --staged、log 與 HEAD~n 的全套檢視指令！"
