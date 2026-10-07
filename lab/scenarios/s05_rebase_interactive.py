"""Scenario 05: Interactive Rebase (Squash / Fixup)."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

AUTH_FINAL_CODE = '''# Authentication Module
def login(username, password):
    if username == "admin" and password == "secret":
        return True
    return False
'''

class Scenario05(BaseScenario):
    id = "05"
    title = "歷史整形：Interactive Rebase 整理零碎 Commit"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "你在本地開發「使用者驗證」功能時，手忙腳亂留下了 3 個零碎且命名混亂的 commit：\n"
        "1. wip auth logic\n"
        "2. fix typo in auth\n"
        "3. really fix typo\n"
        "發送 Pull Request 審查前，技術主管要求你將這 3 個碎 commit 整理 (squash) 成\n"
        "單一、乾淨且有意義的 Commit：「feat: implement user authentication」。"
    )
    goals = [
        "使用 git log --oneline -4 查看最近的 3 個零碎 Commit",
        "執行 git rebase -i HEAD~3 啟動互動式變基",
        "在編輯器中保留第 1 個 pick，將後續 2 個改為 squash (s) 或 fixup (f)",
        "將合併後的最終 Commit 訊息改為 feat: implement user authentication",
        "確保這 3 個零碎 commit 完美融合為 1 個"
    ]
    next_steps = [
        "檢視零碎 commit：git log --oneline -4",
        "啟動互動變基：git rebase -i HEAD~3",
        "編輯指令檔案：第一行保持 pick，第二、三行改為 squash 或 s，存檔離開",
        "編輯新 Commit 訊息為：feat: implement user authentication",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "輸入 git rebase -i HEAD~3 會在終端機打開文字編輯器（通常是 vim 或 nano）。",
        "如果是 vim：按 i 進入編輯模式，把第 2、3 行開頭的 'pick' 改為 's'，按 Esc 後輸入 :wq 存檔退出。",
        "接著 Git 會請你輸入合併後的 Commit 訊息，將訊息改為 feat: implement user authentication 後存檔退出即可！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('App running')\n", "feat: base project setup")

        # 3 messy commits
        engine.commit_file("auth.py", "# auth wip\ndef logn(): pass\n", "wip auth logic")
        engine.commit_file("auth.py", "# auth wip\ndef login(): pass\n", "fix typo in auth")
        engine.commit_file("auth.py", AUTH_FINAL_CODE, "really fix typo")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        if (engine.repo_dir / ".git" / "rebase-merge").exists() or (engine.repo_dir / ".git" / "rebase-apply").exists():
            return False, "Interactive Rebase 尚未完成！請完成編輯器存檔或輸入 git rebase --continue。"

        count = engine.get_commit_count()
        if count > 2:
            return False, f"目前歷史中仍有 {count} 個 Commit，表示尚未成功將 3 個零碎 commit 合併為 1 個（應該剩下 2 個 commit：base + auth）。"

        code, out, _ = engine.run_git("log", "-1", "--pretty=%B", check=False)
        msg = out.strip().lower()
        if "user authentication" not in msg and "auth" not in msg:
            return False, f"最新 Commit 的訊息為 '{out.strip()}'，請確保包含 'feat: implement user authentication'。"

        if not engine.file_exists("auth.py"):
            return False, "auth.py 遺失，請確認程式碼是否正確保留。"

        return True, "太神了！你掌握了互動式變基 (rebase -i)，這是保持 Git Commit 歷史整潔專業的終極利器！"
