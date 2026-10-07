"""Scenario 06: Mock Remote Collaboration and Non-Fast-Forward Push Rejection."""

import tempfile
import shutil
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario06(BaseScenario):
    id = "06"
    title = "模擬協作：遠端衝突與 Non-Fast-Forward 推送被拒"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "單人學習最難體會的痛點：多人對 GitHub 遠端倉庫進行即時協作！\n"
        "實驗室已在本地為你搭建了模擬的遠端中央倉庫 (origin)。\n"
        "你在本地 main 上寫好了「會員積分系統 (points.py)」並建立了 Commit。\n"
        "但就在你要推送到遠端時，同事 Alice 早一步向遠端 push 了「公告通知 (notice.txt)」！\n"
        "當你嘗試 git push 時，Git 會拋出令初學者膽顫心驚的 non-fast-forward 被拒絕錯誤！"
    )
    goals = [
        "嘗試執行 git push origin main，親眼觀察終端機出現的 [rejected] 報錯訊息",
        "理解為什麼會被拒絕（遠端存在你本地所沒有的 Alice 提交）",
        "使用業界標準做法：執行 git pull --rebase origin main 同步遠端並重整歷史",
        "再次執行 git push origin main，成功將功能推送至遠端倉庫！"
    ]
    next_steps = [
        "體驗報錯：git push origin main (觀察 rejected 錯誤)",
        "拉取並變基：git pull --rebase origin main",
        "推送到遠端：git push origin main",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "直接 push 會被拒絕，因為遠端有 Alice 的新 Commit。千萬不要用 --force 強推！",
        "請輸入 git pull --rebase origin main，這會先將 Alice 的更新拉下來，並將你的 points.py 接在後面。",
        "完成拉取與變基後，再次輸入 git push origin main 即可順利推送！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('App running')\n", "feat: base project")

        # Create bare remote repository
        remote_path = engine.repo_dir / ".git-lab-remote"
        if remote_path.exists():
            shutil.rmtree(remote_path, ignore_errors=True)
        remote_path.mkdir(parents=True, exist_ok=True)
        
        # Init bare repo
        engine.run_git("-C", str(remote_path), "init", "--bare", "-b", "main")

        # Configure origin
        engine.run_git("remote", "remove", "origin", check=False)
        engine.run_git("remote", "add", "origin", str(remote_path))
        engine.run_git("push", "-u", "origin", "main")

        # Simulate Alice pushing a commit via a temporary clone
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            engine.run_git("clone", str(remote_path), str(temp_path))
            
            alice_file = temp_path / "notice.txt"
            with open(alice_file, "w", encoding="utf-8") as f:
                f.write("公告：系統將於今晚維護更新。\n")

            env = {
                "GIT_AUTHOR_NAME": "Alice",
                "GIT_AUTHOR_EMAIL": "alice@team.local",
                "GIT_COMMITTER_NAME": "Alice",
                "GIT_COMMITTER_EMAIL": "alice@team.local",
            }
            subprocess_run = engine.run_git("-C", str(temp_path), "add", "notice.txt", env=env)
            engine.run_git("-C", str(temp_path), "commit", "-m", "feat(alice): add maintenance notice", env=env)
            engine.run_git("-C", str(temp_path), "push", "origin", "main", env=env)

        # Now in user repo, create user's commit locally without pulling Alice's commit
        engine.commit_file("points.py", "def get_points(user): return 100\n", "feat: add user points system")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if local main has both points.py and notice.txt
        if not engine.file_exists("points.py"):
            return False, "本地缺少 points.py 檔案！"
        if not engine.file_exists("notice.txt"):
            return False, "尚未成功同步 Alice 在遠端提交的 notice.txt，請執行 git pull --rebase origin main。"

        # Check if remote has the user's latest commit
        remote_path = engine.repo_dir / ".git-lab-remote"
        code, remote_head, _ = engine.run_git("-C", str(remote_path), "rev-parse", "main", check=False)
        code2, local_head, _ = engine.run_git("rev-parse", "main", check=False)

        if code != 0 or code2 != 0 or remote_head.strip() != local_head.strip():
            return False, "遠端倉庫的 HEAD 與你的本地 main 尚未同步！請確認已成功執行 git push origin main。"

        return True, "太棒了！你親身經歷了多人協作中最關鍵的推送衝突，並學會以優雅的 git pull --rebase 解決！"
