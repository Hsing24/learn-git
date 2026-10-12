"""Scenario 28: Clone, Push, and Branch Tracking."""

import shutil
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario28(BaseScenario):
    id = "28"
    title = "Clone、首次推送與追蹤分支"
    difficulty = "初階 ⭐⭐"
    story = (
        "第一天要從公司遠端倉庫 clone 專案、開分支、推上去，並看懂 ahead/behind 是什麼意思。\n"
        "實驗室已建立好模擬遠端中央倉庫 (origin)。\n"
        "請開出 feature/profile 分支，提交修改後使用 git push -u origin feature/profile 推送！"
    )
    goals = [
        "開出並切換至新分支：git switch -c feature/profile",
        "在分支上建立一個提交：git commit -am 'feat: user profile'",
        "首次推送並綁定上游追蹤：git push -u origin feature/profile",
        "使用 git branch -vv 查看 upstream 追蹤狀態"
    ]
    next_steps = [
        "建立分支：git switch -c feature/profile",
        "提交檔案：echo 'def profile(): pass' >> app.py && git commit -am 'feat: user profile'",
        "關聯推送：git push -u origin feature/profile",
        "檢視狀態：git branch -vv",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "執行 git switch -c feature/profile 開出分支。",
        "修改 app.py 並執行 git commit -am 'feat: user profile' 提交。",
        "執行 git push -u origin feature/profile 將分支推送到遠端倉庫。",
        "完成後執行 ./git-lab verify 驗收成果！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('App running')\n", "feat: base project")

        # Create bare remote repository
        remote_path = engine.repo_dir / ".git-lab-remote-28"
        if remote_path.exists():
            shutil.rmtree(remote_path, ignore_errors=True)
        remote_path.mkdir(parents=True, exist_ok=True)

        engine.run_git("-C", str(remote_path), "init", "--bare", "-b", "main")
        engine.run_git("remote", "remove", "origin", check=False)
        engine.run_git("remote", "add", "origin", str(remote_path))
        engine.run_git("push", "-u", "origin", "main")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check target repo: could be engine.workspace or engine.workspace / "app"
        app_dir = engine.workspace / "app"
        check_dir = app_dir if (app_dir / ".git").exists() else engine.workspace

        # Check local branch feature/profile
        code, branches_out, _ = engine.run_git("-C", str(check_dir), "branch", check=False)
        if "feature/profile" not in branches_out:
            return False, "尚未建立 feature/profile 分支！請執行 git switch -c feature/profile。"

        # Check remote has feature/profile
        remote_path = engine.repo_dir / ".git-lab-remote-28"
        code, r_out, _ = engine.run_git("-C", str(remote_path), "branch", check=False)
        if "feature/profile" not in r_out:
            return False, "遠端倉庫尚未收到 feature/profile 分支！請執行 git push -u origin feature/profile。"

        # Check tracking
        code, vv_out, _ = engine.run_git("-C", str(check_dir), "branch", "-vv", check=False)
        has_tracking = any("feature/profile" in line and "[origin/feature/profile" in line for line in vv_out.splitlines())
        if not has_tracking:
            return False, "feature/profile 分支尚未設定 upstream 追蹤！請使用 git push -u origin feature/profile。"

        return True, "太棒了！你跑通了 Clone、分支開發、Upstream 追蹤推送的完整工作流程！"
