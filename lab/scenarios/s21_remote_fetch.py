"""Scenario 21: Remote management and git fetch vs git pull."""

import subprocess
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario21(BaseScenario):
    id = "21"
    title = "遠端全貌：git remote 管理與 git fetch vs git pull 深度解密"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "高見龍老師《為你自己學 Git》關鍵協作課題：Fork 專案與 Fetch/Pull 核心差異！\n"
        "當你參與開源專案或跨團隊協作時，你除了擁有自己 Fork 的遠端倉庫 (`origin`) 之外，\n"
        "還必須追蹤原作者/團隊的核心主倉庫（通常命名為 `upstream`）。\n"
        "很多新手習慣盲目敲 `git pull`，但其實 `git pull` 的底層本質是 **『git fetch + git merge』**！\n"
        "在大型專案中，未經檢查直接 pull 很容易被突如其來的衝突或不相容改動打亂當前工作。\n"
        "本關為你在本地搭設了模擬的 upstream 上游倉庫。\n"
        "請配置 upstream 遠端、透過 `git fetch upstream` 下載最新進度觀察，再將其合併進本地 main 分支！"
    )
    goals = [
        "查看 mock_upstream 的路徑，並使用 git remote add upstream <path> 註冊上游遠端",
        "使用 git remote -v 檢視並確認 upstream 遠端設定正確",
        "執行 git fetch upstream 下載上游最新進度至本地追蹤指針 (upstream/main)",
        "使用 git merge upstream/main 將上游安全補丁同步合併至本地 main 分支",
        "確認本地 main 包含上游最新提交且工作區乾淨"
    ]
    next_steps = [
        "查看現有遠端清單：git remote -v",
        "新增 upstream 遠端（路徑記錄於 upstream_path.txt）：git remote add upstream $(cat upstream_path.txt)",
        "抓取上游最新進度：git fetch upstream",
        "檢視上游的新提交：git log upstream/main --oneline -n 3",
        "將上游進度合併進本地 main：git merge upstream/main",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "git fetch 只會下載物件與更新 upstream/main 指針，絕對不會動到你的工作目錄檔案，非常安全！",
        "若只想抓取特定分支，可下：git fetch upstream main。",
        "完成後可使用 git branch -r 查看所有遠端追蹤分支。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()

        # 1. 在 workspace 外建立一個獨立的 mock upstream 倉庫
        upstream_repo = engine.project_root / "mock_upstream.git"
        if upstream_repo.exists():
            import shutil
            shutil.rmtree(upstream_repo, ignore_errors=True)
        upstream_repo.mkdir(parents=True, exist_ok=True)

        subprocess.run(["git", "init", "--bare"], cwd=upstream_repo, check=True, stdout=subprocess.DEVNULL)

        # 2. 初始化本地 workspace
        engine.run_git("checkout", "-B", "main", check=False)
        base_app = engine.workspace / "app.py"
        base_app.write_text("print('App v1.0.0 Online')\n", encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: initial commit for fork")

        # 3. 推送初始狀態至 upstream_repo
        subprocess.run(["git", "push", str(upstream_repo), "main"], cwd=engine.workspace, check=True, stdout=subprocess.DEVNULL)

        # 4. 在臨時目錄中模擬原作者向 upstream 推送重大安全補丁
        temp_author = engine.project_root / "temp_author"
        if temp_author.exists():
            import shutil
            shutil.rmtree(temp_author, ignore_errors=True)
        subprocess.run(["git", "clone", str(upstream_repo), str(temp_author)], check=True, stdout=subprocess.DEVNULL)
        patch_file = temp_author / "security.py"
        patch_file.write_text("SECRET_SALT = 'hashing_salt_9988'\ndef verify_token(): return True\n", encoding="utf-8")
        subprocess.run(["git", "add", "security.py"], cwd=temp_author, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(["git", "commit", "-m", "fix: critical security patch from upstream"], cwd=temp_author, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(["git", "push", "origin", "main"], cwd=temp_author, check=True, stdout=subprocess.DEVNULL)
        import shutil
        shutil.rmtree(temp_author, ignore_errors=True)

        # 5. 在 workspace 提供 upstream 路徑提示檔
        path_hint = engine.workspace / "upstream_path.txt"
        path_hint.write_text(str(upstream_repo), encoding="utf-8")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查 git remote 是否已註冊 upstream
        _, remotes_out, _ = engine.run_git("remote", "-v")
        if "upstream" not in remotes_out:
            return False, "尚未註冊 'upstream' 遠端！請使用 git remote add upstream $(cat upstream_path.txt) 新增。"

        # 2. 檢查本地 security.py 是否已合併進來
        sec_file = engine.workspace / "security.py"
        if not sec_file.exists():
            return False, "本地 main 分支尚未包含上游的安全補丁 security.py！請確認是否已執行 git fetch upstream 與 git merge upstream/main。"

        # 3. 檢查 log 是否包含上游的 Commit
        _, log_out, _ = engine.run_git("log", "--oneline")
        if "critical security patch" not in log_out:
            return False, "本地 main 分支尚未合併上游的最新提交 'fix: critical security patch from upstream'。"

        # 4. 檢查工作區是否乾淨（可保留 upstream_path.txt 或忽略）
        _, status_out, _ = engine.run_git("status", "--porcelain")
        lines = [l for l in status_out.splitlines() if not any(x in l for x in ("upstream_path.txt", "git-lab"))]
        if lines:
            return False, "工作區尚有未提交或未合併的檔案，請維持乾淨狀態。"

        return True, "🎉 太專業了！你解鎖了 git remote 與 git fetch 的完整協作思維，在掌握遠端動向後精準合入上游進度，完全避免了盲目 pull 的風險！"
