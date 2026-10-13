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
        "第二筆提交發生衝突；解決時保留 main 的更新與 feature step 2：編輯 app.py",
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

        # The first feature commit applies cleanly; the second conflicts with main.
        engine.run_git("checkout", "HEAD~1")
        engine.run_git("checkout", "-b", "feature")
        engine.commit_file("helper.py", "def helper(): return True\n", "feat: feature step 1")
        engine.commit_file("app.py", "print('base - feature step 2')\n", "feat: feature step 2")
        engine.commit_file("feature.py", "FEATURE_ENABLED = True\n", "feat: feature step 3")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check rebase in progress
        if (engine.repo_dir / ".git" / "rebase-merge").exists() or (engine.repo_dir / ".git" / "rebase-apply").exists():
            return False, "Rebase 尚未完成！請在 git add 後輸入 git rebase --continue 繼續。"

        # Check current branch is feature
        code, cur_b, _ = engine.run_git("branch", "--show-current", check=False)
        if cur_b.strip() != "feature":
            return False, f"目前所在分支為 '{cur_b.strip()}'，請切換回 feature 分支完成驗證。"

        code, count, _ = engine.run_git("rev-list", "--count", "main..feature", check=False)
        if code != 0 or count.strip() != "3":
            return False, "feature 必須保留三筆提交；reset 或略過衝突提交都不算完成 rebase。"

        code, history, _ = engine.run_git("log", "--reverse", "--format=%s", "main..feature", check=False)
        if code != 0 or history.splitlines() != [
            "feat: feature step 1", "feat: feature step 2", "feat: feature step 3"
        ]:
            return False, "feature 的三筆提交順序不正確，請完整解決衝突並繼續 rebase。"

        code, base, _ = engine.run_git("rev-parse", "feature~3", check=False)
        code2, main, _ = engine.run_git("rev-parse", "main", check=False)
        if code != 0 or code2 != 0 or base.strip() != main.strip():
            return False, "feature 的三筆提交必須直接接在 main 之後。"

        expected_app = "print('base - main updated')\nprint('base - feature step 2')\n"
        code, rebased_app, _ = engine.run_git("show", "feature~1:app.py", check=False)
        if code != 0 or rebased_app != expected_app:
            return False, "第二筆提交尚未保留 main 與 feature 的變更，請正確解決 app.py 衝突。"

        code, helper, _ = engine.run_git("show", "feature:helper.py", check=False)
        code2, feature_file, _ = engine.run_git("show", "feature:feature.py", check=False)
        if code != 0 or code2 != 0 or helper != "def helper(): return True\n" or feature_file != "FEATURE_ENABLED = True\n":
            return False, "rebase 後必須保留第一與第三筆 feature 提交的檔案。"

        code, status, _ = engine.run_git("status", "--porcelain", "--untracked-files=no", check=False)
        if code != 0 or status.strip():
            return False, "衝突解決結果尚未完整提交；請執行 git add 與 git rebase --continue。"

        return True, "太厲害了！你成功馴服了 Rebase 中途衝突，掌握了 continue / status 狀態機的推進精髓！"
