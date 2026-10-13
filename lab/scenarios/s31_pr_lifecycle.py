"""Scenario 31: Full PR Lifecycle (rebase, force-with-lease, and branch cleanup)."""

import shutil
import tempfile
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario31(BaseScenario):
    id = "31"
    title = "一個 PR 從開到收：變基最新主線與安全強推"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "你的 PR 等待 Review 時主線被合併了新功能。\n"
        "主管要求先 rebase 最新 main 再推，且必須使用最安全的 --force-with-lease，最後清理分支！"
    )
    goals = [
        "抓取遠端最新變更：git fetch origin",
        "將 feature/cart 變基至遠端主線：git rebase origin/main",
        "使用租約保護安全強推：git push --force-with-lease",
        "模擬 PR 合併並刪除遠端分支：./git-lab pr merge feature/cart",
        "切回 main 並拉取合併結果：git switch main && git pull --ff-only",
        "刪除本機 feature/cart 分支並 prune 清理"
    ]
    next_steps = [
        "抓取遠端：git fetch origin",
        "變基最新主線：git rebase origin/main",
        "安全強推：git push --force-with-lease origin feature/cart",
        "模擬 PR 合併：./git-lab pr merge feature/cart",
        "切回主線並同步合併結果：git switch main && git pull --ff-only",
        "刪除特徵分支：git branch -d feature/cart",
        "清理追蹤：git fetch --prune",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "執行 git fetch origin 取得遠端 main 最新更新。",
        "在 feature/cart 上執行 git rebase origin/main 完成歷史嫁接。",
        "執行 git push --force-with-lease origin feature/cart 安全推送。",
        "推送後執行 ./git-lab pr merge feature/cart 模擬 GitHub 合併，再同步 main 並清理分支。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('shop base')\n", "feat: base ecommerce")

        # Create bare remote repository
        remote_path = engine.repo_dir / ".git-lab-remote-31"
        if remote_path.exists():
            shutil.rmtree(remote_path, ignore_errors=True)
        remote_path.mkdir(parents=True, exist_ok=True)

        engine.run_git("-C", str(remote_path), "init", "--bare", "-b", "main")
        engine.run_git("remote", "remove", "origin", check=False)
        engine.run_git("remote", "add", "origin", str(remote_path))
        engine.run_git("push", "-u", "origin", "main")

        # Feature cart branch created and pushed
        engine.run_git("checkout", "-b", "feature/cart")
        engine.commit_file("cart.py", "def add_cart(): pass\n", "feat: cart logic")
        engine.run_git("push", "-u", "origin", "feature/cart")

        # Colleague pushed 2 new commits to remote main
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            engine.run_git("clone", str(remote_path), str(temp_path))
            with open(temp_path / "coupons.py", "w", encoding="utf-8") as f:
                f.write("def apply_coupon(): pass\n")
            engine.run_git("-C", str(temp_path), "add", "coupons.py")
            engine.run_git("-C", str(temp_path), "commit", "-m", "feat: add coupons")
            engine.run_git("-C", str(temp_path), "push", "origin", "main")

        # Leave user on feature/cart
        engine.run_git("checkout", "feature/cart")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        remote_path = engine.repo_dir / ".git-lab-remote-31"

        # main must contain the feature and match both remote references.
        code, remote_cart, _ = engine.run_git("-C", str(remote_path), "show", "main:cart.py", check=False)
        if code != 0 or remote_cart != "def add_cart(): pass\n":
            return False, "遠端 main 尚未包含 cart.py；請先模擬 PR 合併 feature/cart。"

        code, remote_log, _ = engine.run_git("-C", str(remote_path), "log", "main", "--format=%s", check=False)
        if code != 0 or "feat: cart logic" not in remote_log.splitlines():
            return False, "遠端 main 缺少 feature/cart 的功能提交；請確認 PR 已合併。"

        code, r_main_head, _ = engine.run_git("-C", str(remote_path), "rev-parse", "main", check=False)
        code_local, local_main_head, _ = engine.run_git("rev-parse", "main", check=False)
        code_tracking, tracking_main_head, _ = engine.run_git("rev-parse", "origin/main", check=False)
        if code != 0 or code_local != 0 or code_tracking != 0:
            return False, "無法確認本機 main、origin/main 與遠端 main；請切回 main 並 git pull。"
        if not (r_main_head.strip() == local_main_head.strip() == tracking_main_head.strip()):
            return False, "本機 main、origin/main 與遠端 main 尚未同步；請在合併後執行 git pull --ff-only。"

        # The remote PR is merged and both local branch refs are cleaned up.
        code, _, _ = engine.run_git("-C", str(remote_path), "show-ref", "--verify", "--quiet", "refs/heads/feature/cart", check=False)
        if code == 0:
            return False, "遠端 feature/cart 尚未在 PR 合併後刪除；請執行 ./git-lab pr merge feature/cart。"

        code, cur_branch, _ = engine.run_git("branch", "--show-current", check=False)
        if cur_branch.strip() != "main":
            return False, "請切換回 main 分支完成收尾。"

        code, _, _ = engine.run_git("show-ref", "--verify", "--quiet", "refs/heads/feature/cart", check=False)
        if code == 0:
            return False, "本機 feature/cart 分支尚未刪除；請執行 git branch -d feature/cart。"

        code, _, _ = engine.run_git("show-ref", "--verify", "--quiet", "refs/remotes/origin/feature/cart", check=False)
        if code == 0:
            return False, "origin/feature/cart 追蹤參照仍存在；請執行 git fetch --prune。"

        return True, "太專業了！你走完了完整現代 PR 生命週期，安全強推且完美收尾！"
