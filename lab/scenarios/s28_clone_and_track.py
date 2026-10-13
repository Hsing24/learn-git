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
        "實驗室已建立好模擬遠端中央倉庫。請先 clone 到 app 目錄，再開出 feature/profile 分支，提交修改並推送！"
    )
    goals = [
        "將模擬遠端 clone 到 app 目錄：git clone ./.git-lab-remote-28 app",
        "開出並切換至新分支：git switch -c feature/profile",
        "在分支上建立一個提交：git commit -am 'feat: user profile'",
        "首次推送並綁定上游追蹤：git push -u origin feature/profile",
        "使用 git branch -vv 查看 upstream 追蹤狀態"
    ]
    next_steps = [
        "在 workspace clone 專案：git clone ./.git-lab-remote-28 app",
        "進入 clone：cd app",
        "建立分支：git switch -c feature/profile",
        "提交檔案：echo 'def profile(): pass' >> app.py && git commit -am 'feat: user profile'",
        "關聯推送：git push -u origin feature/profile",
        "檢視狀態：git branch -vv",
        "驗收成果：../git-lab verify"
    ]
    hints = [
        "先在 workspace 執行 git clone ./.git-lab-remote-28 app，接著 cd app。",
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
        app_dir = engine.workspace / "app"
        if not (app_dir / ".git").exists():
            return False, "尚未 clone 遠端專案到 workspace/app！請先執行 git clone ./.git-lab-remote-28 app。"
        check_dir = app_dir

        code, top_level, _ = engine.run_git("-C", str(check_dir), "rev-parse", "--show-toplevel", check=False)
        if code != 0 or Path(top_level.strip()).resolve() != app_dir.resolve():
            return False, "workspace/app 不是獨立的 clone，請從模擬遠端重新 clone。"

        remote_path = engine.repo_dir / ".git-lab-remote-28"
        code, origin_url, _ = engine.run_git("-C", str(check_dir), "remote", "get-url", "origin", check=False)
        origin = Path(origin_url.strip())
        if not origin.is_absolute():
            origin = check_dir / origin
        if code != 0 or origin.resolve() != remote_path.resolve():
            return False, "app clone 的 origin 必須指向實驗室建立的模擬遠端。"

        code, current_branch, _ = engine.run_git("-C", str(check_dir), "branch", "--show-current", check=False)
        if code != 0 or current_branch.strip() != "feature/profile":
            return False, "尚未建立 feature/profile 分支！請執行 git switch -c feature/profile。"

        code, local_head, _ = engine.run_git("-C", str(check_dir), "rev-parse", "HEAD", check=False)
        code2, remote_head, _ = engine.run_git("-C", str(remote_path), "rev-parse", "refs/heads/feature/profile", check=False)
        if code != 0 or code2 != 0 or local_head.strip() != remote_head.strip():
            return False, "遠端倉庫尚未收到目前的 feature/profile 提交！請執行 git push -u origin feature/profile。"

        code, base_head, _ = engine.run_git("-C", str(check_dir), "rev-parse", "refs/remotes/origin/main", check=False)
        code2, parent, _ = engine.run_git("-C", str(check_dir), "rev-parse", "HEAD^", check=False)
        if code != 0 or code2 != 0 or parent.strip() != base_head.strip():
            return False, "feature/profile 必須是在 clone 的 origin/main 上新增的一筆提交。"

        code, base_branch, _ = engine.run_git("-C", str(check_dir), "rev-parse", "refs/heads/main", check=False)
        if code != 0 or base_branch.strip() != base_head.strip():
            return False, "clone 的 main 必須維持 origin/main 的原始版本。"

        code, remote_base, _ = engine.run_git("-C", str(remote_path), "rev-parse", "refs/heads/main", check=False)
        if code != 0 or remote_base.strip() != base_head.strip():
            return False, "模擬遠端的 main 必須維持 clone 時的原始版本。"

        expected_app = "print('App running')\ndef profile(): pass\n"
        code, app_content, _ = engine.run_git("-C", str(check_dir), "show", "HEAD:app.py", check=False)
        if code != 0 or app_content != expected_app:
            return False, "feature/profile 的提交必須包含指定的 profile 功能。"

        code, remote_tracking, _ = engine.run_git("-C", str(check_dir), "rev-parse", "refs/remotes/origin/feature/profile", check=False)
        if code != 0 or remote_tracking.strip() != local_head.strip():
            return False, "origin/feature/profile 尚未更新至本機提交。"

        code, vv_out, _ = engine.run_git("-C", str(check_dir), "branch", "-vv", check=False)
        has_tracking = any("feature/profile" in line and "[origin/feature/profile" in line for line in vv_out.splitlines())
        if not has_tracking:
            return False, "feature/profile 分支尚未設定 upstream 追蹤！請使用 git push -u origin feature/profile。"

        code, status, _ = engine.run_git("-C", str(check_dir), "status", "--porcelain", check=False)
        if code != 0 or status.strip():
            return False, "feature/profile 的修改必須提交並推送，工作目錄需保持乾淨。"

        return True, "太棒了！你跑通了 Clone、分支開發、Upstream 追蹤推送的完整工作流程！"
