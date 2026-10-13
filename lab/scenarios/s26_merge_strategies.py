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
        if engine.get_current_branch() != "main":
            return False, "請切回 main 分支後再完成合併驗收。"

        code, _, _ = engine.run_git("show-ref", "--verify", "--quiet", "refs/heads/feature/a", check=False)
        if code == 0:
            return False, "feature/a 分支尚未刪除！請執行 git branch -d feature/a。"
        code, _, _ = engine.run_git("show-ref", "--verify", "--quiet", "refs/heads/feature/b", check=False)
        if code == 0:
            return False, "feature/b 分支尚未刪除！請執行 git branch -D feature/b。"

        code, head_parents, _ = engine.run_git("rev-list", "--parents", "-n", "1", "HEAD", check=False)
        head_fields = head_parents.split()
        if code != 0 or len(head_fields) != 2:
            return False, "最新提交必須是 feature/b 的 squash 結果（只有一個 parent），不能用 --no-ff 合併 b。"

        merge_hash = head_fields[1]
        code, merge_parents, _ = engine.run_git("rev-list", "--parents", "-n", "1", merge_hash, check=False)
        merge_fields = merge_parents.split()
        if code != 0 or len(merge_fields) != 3:
            return False, "main 歷史中缺少 feature/a 的雙 parent merge commit！請執行 git merge --no-ff feature/a。"

        base_hash, a_tip = merge_fields[1], merge_fields[2]
        code, a_parents, _ = engine.run_git("rev-list", "--parents", "-n", "1", a_tip, check=False)
        a_fields = a_parents.split()
        if code != 0 or len(a_fields) != 2 or a_fields[1] == base_hash:
            return False, "feature/a 必須保留兩筆功能提交，並以 --no-ff 合併到 main。"
        code, first_a_parents, _ = engine.run_git("rev-list", "--parents", "-n", "1", a_fields[1], check=False)
        if code != 0 or first_a_parents.split() != [a_fields[1], base_hash]:
            return False, "feature/a 的兩筆提交必須直接建立在原始 main 上。"

        code, merge_first_parent, _ = engine.run_git("rev-parse", f"{merge_hash}^1", check=False)
        code2, merge_second_parent, _ = engine.run_git("rev-parse", f"{merge_hash}^2", check=False)
        if code != 0 or code2 != 0 or merge_first_parent.strip() != base_hash or merge_second_parent.strip() != a_tip:
            return False, "feature/a 的 merge commit parent 順序或基底不正確。"

        code, a_one, _ = engine.run_git("show", f"{a_fields[1]}:mod_a.py", check=False)
        code2, a_two, _ = engine.run_git("show", f"{a_tip}:mod_a.py", check=False)
        if code != 0 or code2 != 0 or a_one != "# a1\n" or a_two != "# a1\n# a2\n":
            return False, "feature/a 的提交內容不完整，請保留 part 1 與 part 2。"

        code, b_content, _ = engine.run_git("show", "HEAD:mod_b.py", check=False)
        if code != 0 or b_content != "# b1\n# b2\n":
            return False, "main 缺少 feature/b 的完整 squash 結果，請合併後提交兩筆功能內容。"

        code, prior_b, _ = engine.run_git("show", "HEAD^:mod_b.py", check=False)
        if code == 0:
            return False, "feature/b 的內容必須由 main 上的單 parent squash 提交加入。"

        code, a_content, _ = engine.run_git("show", "HEAD:mod_a.py", check=False)
        code2, app_content, _ = engine.run_git("show", "HEAD:app.py", check=False)
        if code != 0 or code2 != 0 or a_content != "# a1\n# a2\n" or app_content != "print('base')\n":
            return False, "main 的最終 tree 必須保留 base 與 feature/a 的完整內容。"

        code, count, _ = engine.run_git("rev-list", "--count", "HEAD", check=False)
        if code != 0 or count.strip() != "5":
            return False, "歷史應包含 base、feature/a 兩筆提交、a 的 merge commit 與 b 的 squash commit。"

        return True, "太棒了！你親手演練了 --no-ff 與 --squash，並理解了 -d 與 -D 的使用時機！"
