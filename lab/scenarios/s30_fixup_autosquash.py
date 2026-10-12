"""Scenario 30: Fixup Commits and Autosquash Rebase."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario30(BaseScenario):
    id = "30"
    title = "精準修補歷史中的某個 commit"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "PR 包含 4 個 commit。Reviewer 發現你在第 2 個 commit 寫錯了 typo。\n"
        "不要新增零碎的 'fix typo' commit，請用 git commit --fixup 與 autosquash 精確融進原提交！"
    )
    goals = [
        "修正 validator.py 的 typo 並暫存：git add validator.py",
        "使用 git commit --fixup <hash> 建立修補提交",
        "使用 git rebase -i --autosquash main 自動合併",
        "維持分支只有原本的 4 個清晰 commit"
    ]
    next_steps = [
        "修正 typo：echo 'def validate(): return True' > validator.py",
        "加入暫存：git add validator.py",
        "取得 target hash：git log --oneline -4",
        "建立 fixup：git commit --fixup <validator_hash>",
        "自動合併：GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash main",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "使用 git log --oneline 找到包含 'feat: add validator' 的 Commit Hash。",
        "執行 git commit --fixup <hash> 會產生帶有 'fixup!' 前綴的特殊提交。",
        "在終端機輸入 GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash main，Git 會自動移位合併！",
        "確認歷史中沒有 fixup! 提交後執行 ./git-lab verify。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "# scaffold\n", "feat: initial scaffold")

        # 4 feature commits
        engine.run_git("checkout", "-b", "feature")
        engine.commit_file("schema.py", "user = {}\n", "feat: add user schema")
        engine.commit_file("validator.py", "def validte(): return False\n", "feat: add validator helper")
        engine.commit_file("routes.py", "routes = []\n", "feat: add auth routes")
        engine.commit_file("tests.py", "assert True\n", "feat: add auth tests")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        code, log_out, _ = engine.run_git("log", "main..feature", "--pretty=%s", check=False)
        messages = [m.strip() for m in log_out.splitlines() if m.strip()]

        if any("fixup!" in m for m in messages):
            return False, "歷史中仍包含 fixup! 提交，尚未執行 git rebase -i --autosquash main！"

        if len(messages) != 4:
            return False, f"feature 分支應維持為 4 個 Commit，目前有 {len(messages)} 個。"

        if engine.file_exists("validator.py"):
            content = (engine.workspace / "validator.py").read_text(encoding="utf-8")
            if "validte" in content:
                return False, "validator.py 依然包含 typo 'validte'，請確認修改已正確合併。"

        return True, "太優雅了！你學會了以 --fixup 與 --autosquash 修飾歷史，提交紀錄無可挑剔！"
