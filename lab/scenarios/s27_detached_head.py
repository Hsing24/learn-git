"""Scenario 27: Detached HEAD and Rescuing Commits."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario27(BaseScenario):
    id = "27"
    title = "分離 HEAD：查看舊版本並救回在上面做的 commit"
    difficulty = "初階 ⭐⭐"
    story = (
        "PM 要你看一下 v1.0 那時候的畫面。\n"
        "你切過去順手修了一個 bug 還 commit 了，切回 main 時 Git 警告你「有 commit 被留下了」。\n"
        "請為這個孤立的 commit 開出 hotfix/v1-legacy 分支，妥善保留並切回 main！"
    )
    goals = [
        "使用 git switch --detach v1.0 切換至舊版本",
        "在舊版本上修改並建立一個修復 Commit",
        "使用 git switch -c hotfix/v1-legacy 建立分支保全成果",
        "安全切回 main 分支：git switch main"
    ]
    next_steps = [
        "切換至標籤：git switch --detach v1.0",
        "進行修改並提交：echo '# fix' >> app.py && git commit -am 'fix: legacy bug on v1.0'",
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
        code, branches_out, _ = engine.run_git("branch", check=False)
        if "hotfix/v1-legacy" not in branches_out:
            return False, "尚未建立 hotfix/v1-legacy 分支以拯救孤立的 commit！"

        # Check hotfix/v1-legacy parent is v1.0 tag
        code, v1_hash, _ = engine.run_git("rev-parse", "v1.0^{commit}", check=False)
        code2, hotfix_hash, _ = engine.run_git("rev-parse", "hotfix/v1-legacy", check=False)
        if code != 0 or code2 != 0:
            return False, "無法取得 v1.0 或 hotfix/v1-legacy 的 commit hash。"

        v1_hash = v1_hash.strip()
        hotfix_hash = hotfix_hash.strip()

        if v1_hash == hotfix_hash:
            return False, "hotfix/v1-legacy 分支上尚未提交任何修復 commit！"

        code, is_anc, _ = engine.run_git("merge-base", "--is-ancestor", v1_hash, hotfix_hash, check=False)
        if code != 0:
            return False, "hotfix/v1-legacy 的基底並非 v1.0 節點！"

        return True, "太棒了！你完整理解了 Detached HEAD 的本質與分支救援技法！"
