"""Scenario 27: Detached HEAD and Rescuing Commits."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario27(BaseScenario):
    id = "27"
    title = '維護舊版：Detached HEAD 與分支救援'
    difficulty = "初階 ⭐⭐"
    story = (
        "PM 跑來問：「v1.0 以前的舊版本表現如何？」你 checkout 過去測試，順手修復了一個問題並 commit。\n"
        "切回 main 之前 Git 警告你 HEAD 處於分離狀態！\n"
        "請為這個孤立無援、飄在半空中的 commit 開出救生分支，妥善保存勞動成果！"
    )
    goals = [
        "使用 git switch --detach v1.0 切換至舊版本",
        "在舊版本上修改並建立一個修復 Commit",
        "使用 git switch -c hotfix/v1-legacy 建立分支保全成果",
        "安全切回 main 分支：git switch main"
    ]
    next_steps = [
        "切換至標籤：git switch --detach v1.0",
        "進行修改並提交：echo '# legacy fix' >> app.py && git commit -am 'fix: legacy bug on v1.0'",
        "建立分支：git switch -c hotfix/v1-legacy",
        "切回主線：git switch main",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "輸入 git switch --detach v1.0 切換至 v1.0 標籤。",
        "修改檔案後輸入 git commit -am 'fix: legacy patch' 完成提交。",
        "輸入 git switch -c hotfix/v1-legacy 為這個 commit 加上分支指標。",
        "最後輸入 git switch main 切回主線並執行 ./git-lab verify！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Release v1.0
        engine.commit_file("app.py", "print('v1.0 stable')\n", "feat: release v1.0")
        engine.run_git("tag", "-a", "v1.0", "-m", "Release 1.0")

        # Main advances
        engine.commit_file("app.py", "print('v2.0 dev')\n", "feat: start v2.0")
        engine.commit_file("feature.py", "def new_feature(): pass\n", "feat: add v2 feature")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Current branch must be main
        code, cur_branch, _ = engine.run_git("branch", "--show-current", check=False)
        if cur_branch.strip() != "main":
            return False, f"目前所在分支為 '{cur_branch.strip()}'，請切回 main 分支：git switch main。"

        # Branch hotfix/v1-legacy must exist
        code, _, _ = engine.run_git("show-ref", "--verify", "--quiet", "refs/heads/hotfix/v1-legacy", check=False)
        if code != 0:
            return False, "尚未建立 hotfix/v1-legacy 分支以拯救孤立的 commit！"

        # Check hotfix/v1-legacy parent is v1.0 tag
        code, v1_hash, _ = engine.run_git("rev-parse", "v1.0^{commit}", check=False)
        code2, hotfix_hash, _ = engine.run_git("rev-parse", "hotfix/v1-legacy", check=False)
        if code != 0 or code2 != 0:
            return False, "無法取得 v1.0 或 hotfix/v1-legacy 的 commit hash。"

        v1_hash = v1_hash.strip()
        hotfix_hash = hotfix_hash.strip()

        code, parents, _ = engine.run_git("rev-list", "--parents", "-n", "1", hotfix_hash, check=False)
        fields = parents.split()
        if code != 0 or len(fields) != 2 or fields[1] != v1_hash:
            return False, "hotfix/v1-legacy 必須指向直接建立在 v1.0 上的修復 commit，不能只從 main 開分支。"

        code, app, _ = engine.run_git("show", "hotfix/v1-legacy:app.py", check=False)
        if code != 0 or app != "print('v1.0 stable')\n# legacy fix\n":
            return False, "hotfix/v1-legacy 的 commit 必須包含 v1.0 上的 legacy bug 修復。"

        return True, "太棒了！你完整理解了 Detached HEAD 的本質與分支救援技法！"
