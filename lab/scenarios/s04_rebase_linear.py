"""Scenario 04: Linear History with Git Rebase."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario04(BaseScenario):
    id = "04"
    title = "變基藝術：使用 git rebase 保持線性歷史"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "你在 feature-cart 分支上認真開發購物車模組。\n"
        "但在你開發期間，同事已經向 main 分支合併了 payment.py 與 config.py 兩個重要更新！\n"
        "如果這時直接使用 merge，歷史記錄會產生交叉分叉與多餘的 Merge Commit。\n"
        "團隊推崇「乾淨俐落的線性歷史 (Linear History)」，規範要求你在合併前，必須先將分支 rebase 到 main 的最新版本之後！"
    )
    goals = [
        "使用 ./git-lab tree 觀察目前 main 與 feature-cart 的分叉樹狀圖",
        "確認自己位於 feature-cart 分支上",
        "執行 git rebase main，將 feature-cart 嫁接至 main 的最新 commit 後方",
        "再次檢視歷史樹，體驗無分叉的乾淨線性歷史！"
    ]
    next_steps = [
        "觀察分叉歷史：./git-lab tree",
        "確認在 feature-cart 分支：git status",
        "執行變基：git rebase main",
        "觀察變基後的直線歷史：./git-lab tree",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "確保當前分支是 feature-cart（如果不是，輸入 git checkout feature-cart）。",
        "執行變基指令：git rebase main。",
        "完成後輸入 git log --oneline --graph，你會發現歷史線變成了一條直線！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)
        engine.run_git("branch", "-D", "feature-cart", check=False)

        # Base commit
        engine.commit_file("app.py", "print('便當快點核心')\n", "feat: base app structure")

        # Create feature-cart branch with 2 commits
        engine.run_git("checkout", "-b", "feature-cart")
        engine.commit_file("cart.py", "class Cart:\n    pass\n", "feat: add cart class")
        engine.commit_file("cart.py", "class Cart:\n    def __init__(self):\n        self.items = []\n", "feat: initialize items list in cart")

        # Switch to main and add 2 newer commits
        engine.run_git("checkout", "main")
        engine.commit_file("payment.py", "def pay(): return True\n", "feat: update payment gateway")
        engine.commit_file("config.py", "DEBUG = False\n", "chore: production config settings")

        # Switch back to feature-cart for user
        engine.run_git("checkout", "feature-cart")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        branch = engine.get_current_branch()
        if branch != "feature-cart":
            return False, f"目前所在分支為 '{branch}'，請切換至 'feature-cart' (git checkout feature-cart) 再進行驗證。"

        # Check if rebase is currently in progress or stuck
        if (engine.repo_dir / ".git" / "rebase-merge").exists() or (engine.repo_dir / ".git" / "rebase-apply").exists():
            return False, "Rebase 尚未完成！請解決可能的暫停狀態或輸入 git rebase --continue 完成變基。"

        # Check merge-base between feature-cart and main
        # If rebased, merge-base(feature-cart, main) == commit hash of main
        code, main_hash, _ = engine.run_git("rev-parse", "main", check=False)
        code2, mb_hash, _ = engine.run_git("merge-base", "feature-cart", "main", check=False)
        if code != 0 or code2 != 0 or main_hash.strip() != mb_hash.strip():
            return False, "feature-cart 尚未以 main 的最新 Commit 作為基底，請執行 git rebase main。"

        # Check all files exist in feature-cart
        if not engine.file_exists("cart.py") or not engine.file_exists("payment.py") or not engine.file_exists("config.py"):
            return False, "變基後的檔案不完整，請確認 cart.py, payment.py, config.py 皆正確存在。"

        return True, "恭喜！你成功運用 git rebase 達成了高質感的線性歷史，這是許多資深工程團隊極度重視的技能！"
