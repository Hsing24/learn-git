"""Scenario 26: Merge Strategies (no-ff, squash, and branch cleanup)."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario26(BaseScenario):
    id = "26"
    title = "合併策略：Fast-forward / --no-ff / --squash 與清理分支"
    difficulty = "初階 ⭐⭐"
    story = (
        "GitHub 上有三個合併按鈕（Create a merge commit / Squash and merge / Rebase and merge）。\n"
        "主管要你在本機親手操作一遍，搞懂 --no-ff 與 --squash 的差別，並學會刪除分支！"
    )
    goals = [
        "在 main 分支上執行 git merge --no-ff feature/a 保留分支拓撲",
        "在 main 分支上執行 git merge --squash feature/b 壓扁提交",
        "為 squash 提交新 commit：git commit -m \"feat: implement b\"",
        "刪除已合併的 feature/a 分支：git branch -d feature/a",
        "強制刪除 squash 之後的 feature/b 分支：git branch -D feature/b"
    ]
    next_steps = [
        "切換至 main：git checkout main",
        "非快進合併 a：git merge --no-ff feature/a",
        "壓縮合併 b：git merge --squash feature/b",
        "提交 b：git commit -m \"feat: implement b\"",
        "刪除 a：git branch -d feature/a",
        "刪除 b：git branch -D feature/b",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "確認在 main 分支上執行 git merge --no-ff feature/a",
        "接著執行 git merge --squash feature/b，並輸入 git commit -m 'feat: implement b'",
        "最後使用 git branch -d feature/a 與 git branch -D feature/b 刪除兩分支。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('base')\n", "feat: base app")

        # feature/a
        engine.run_git("checkout", "-b", "feature/a")
        engine.commit_file("mod_a.py", "# a1\n", "feat(a): part 1")
        engine.commit_file("mod_a.py", "# a1\n# a2\n", "feat(a): part 2")

        # feature/b from main
        engine.run_git("checkout", "main")
        engine.run_git("checkout", "-b", "feature/b")
        engine.commit_file("mod_b.py", "# b1\n", "feat(b): part 1")
        engine.commit_file("mod_b.py", "# b1\n# b2\n", "feat(b): part 2")

        engine.run_git("checkout", "main")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if branches are deleted
        code, branches_out, _ = engine.run_git("branch", check=False)
        branches = [b.strip().replace("* ", "") for b in branches_out.splitlines()]
        if "feature/a" in branches:
            return False, "feature/a 分支尚未刪除！請執行 git branch -d feature/a。"
        if "feature/b" in branches:
            return False, "feature/b 分支尚未刪除！請執行 git branch -D feature/b。"

        # Check if main has a merge commit with 2 parents
        code, log_out, _ = engine.run_git("log", "--merges", "-1", "--pretty=%h", check=False)
        if not log_out.strip():
            return False, "main 歷史中缺少 --no-ff 的 Merge Commit！請確認使用了 git merge --no-ff feature/a。"

        # Check if mod_b.py exists in HEAD
        if not engine.file_exists("mod_b.py"):
            return False, "main 分支缺少 mod_b.py，請確認已執行 git merge --squash feature/b 並 commit。"

        return True, "太棒了！你親手演練了 --no-ff 與 --squash，並理解了 -d 與 -D 的使用時機！"
