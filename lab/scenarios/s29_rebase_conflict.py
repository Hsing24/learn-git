"""Scenario 29: Rebase with Conflicts (continue, abort, skip)."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario29(BaseScenario):
    id = "29"
    title = "Rebase 中途衝突：continue / abort / skip"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "照主管說的 rebase main，結果在第 2 個 commit 發生衝突，終端機停在半途中。\n"
        "請冷靜解讀衝突、編輯檔案、使用 git add 標記已解決，並執行 git rebase --continue 完成變基！"
    )
    goals = [
        "執行 git rebase main 觸發衝突並停在中間提交",
        "使用 git status 查看處於 rebase in progress 狀態",
        "手動編輯 app.py 消除 <<<<<<< 與 >>>>>>> 衝突標記",
        "將解決後的檔案加入暫存：git add app.py",
        "繼續完成變基流程：git rebase --continue"
    ]
    next_steps = [
        "啟動變基：git rebase main",
        "解決衝突：編輯 app.py",
        "標記暫存：git add app.py",
        "繼續變基：git rebase --continue",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "輸入 git rebase main 觸發衝突，此時 Git 會停在中間提交等待你處理解決。",
        "編輯 app.py，保留雙方所需代碼並刪除所有 <<<<<<<、=======、>>>>>>> 衝突標記。",
        "執行 git add app.py 後，千萬不要執行 git commit，而是輸入 git rebase --continue！",
        "變基全部完成後執行 ./git-lab verify。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('base')\n", "feat: base app")

        # main modifies app.py
        engine.commit_file("app.py", "print('base - main updated')\n", "feat: main feature")

        # feature branch with 2 commits, commit 1 conflicts
        engine.run_git("checkout", "HEAD~1")
        engine.run_git("checkout", "-b", "feature")
        engine.commit_file("app.py", "print('base - feature step 1')\n", "feat: feature step 1")
        engine.commit_file("helper.py", "def helper(): return True\n", "feat: feature step 2")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check rebase in progress
        if (engine.repo_dir / ".git" / "rebase-merge").exists() or (engine.repo_dir / ".git" / "rebase-apply").exists():
            return False, "Rebase 尚未完成！請在 git add 後輸入 git rebase --continue 繼續。"

        # Check current branch is feature
        code, cur_b, _ = engine.run_git("branch", "--show-current", check=False)
        if cur_b.strip() != "feature":
            return False, f"目前所在分支為 '{cur_b.strip()}'，請切換回 feature 分支完成驗證。"

        # Check main is ancestor of feature
        code, _, _ = engine.run_git("merge-base", "--is-ancestor", "main", "feature", check=False)
        if code != 0:
            return False, "feature 分支尚未變基到 main 之上！請執行 git rebase main。"

        # Check conflict markers
        if engine.file_exists("app.py"):
            content = (engine.workspace / "app.py").read_text(encoding="utf-8")
            if "<<<<<<" in content or ">>>>>>" in content or "======" in content:
                return False, "app.py 仍包含衝突標記，請手動清理乾淨！"

        return True, "太厲害了！你成功馴服了 Rebase 中途衝突，掌握了 continue / status 狀態機的推進精髓！"
