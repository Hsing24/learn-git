"""Scenario 30: Fixup Commits and Autosquash Rebase."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario30(BaseScenario):
    id = "30"
    title = '修補舊提交：Fixup 與 Autosquash'
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "提了 4 個 commit 的 PR，Reviewer 強哥在第 2 個 commit 抓出一個 typo：\n"
        "「不要給我後面補一個 fix typo commit 污染歷史，融進去！」\n"
        "請用現代黑科技 --fixup 與 --autosquash 進行微創手術，精確將修正靶向融進原提交！"
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
        if engine.get_current_branch() != "feature":
            return False, "請在完成 autosquash 的 feature 分支上驗收。"

        code, log_out, _ = engine.run_git("log", "main..feature", "--pretty=%s", check=False)
        messages = [m.strip() for m in log_out.splitlines() if m.strip()]

        if any("fixup!" in m for m in messages):
            return False, "歷史中仍包含 fixup! 提交，尚未執行 git rebase -i --autosquash main！"

        expected_messages = [
            "feat: add auth tests",
            "feat: add auth routes",
            "feat: add validator helper",
            "feat: add user schema",
        ]
        if messages != expected_messages:
            if len(messages) != 4:
                return False, f"feature 分支應維持為 4 個 Commit，目前有 {len(messages)} 個。"
            return False, "feature 的四筆提交必須維持原有功能順序，並把修正 autosquash 進 validator 提交。"

        code, parent, _ = engine.run_git("rev-parse", "feature~4", check=False)
        code2, main, _ = engine.run_git("rev-parse", "main", check=False)
        if code != 0 or code2 != 0 or parent.strip() != main.strip():
            return False, "feature 的四筆提交必須直接建立在 main 之上。"

        code, validator, _ = engine.run_git("show", "feature:validator.py", check=False)
        if code != 0 or validator != "def validate(): return True\n":
            return False, "feature 的已提交 validator.py 仍有錯誤；僅修改工作檔不算完成。"

        code, status, _ = engine.run_git("status", "--porcelain", "--untracked-files=no", check=False)
        if code != 0 or status.strip():
            return False, "autosquash 後工作目錄仍有未提交變更，請將修正納入歷史。"

        code, validator_commit, _ = engine.run_git(
            "log", "main..feature", "--format=%H", "--grep=^feat: add validator helper$", check=False
        )
        if code != 0 or not validator_commit.strip():
            return False, "找不到已修正的 validator 功能提交。"
        code, committed_validator, _ = engine.run_git(
            "show", f"{validator_commit.strip()}:validator.py", check=False
        )
        if code != 0 or committed_validator != "def validate(): return True\n":
            return False, "validator 修正必須 autosquash 進原本的 validator 提交。"

        return True, "太優雅了！你學會了以 --fixup 與 --autosquash 修飾歷史，提交紀錄無可挑剔！"
