"""Scenario 33: Purging Secrets from Git History."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario33(BaseScenario):
    id = "33"
    title = "密鑰已經推上遠端的事故處理"
    difficulty = "進階 ⭐⭐⭐⭐⭐"
    story = (
        "同事 3 個 commit 前不小心將包含 AWS 密鑰的 .env 提交並推送到遠端！\n"
        "光用 git rm 毫無作用，歷史紀錄依然完整保存了密鑰。\n"
        "請使用歷史清洗工具徹底抹除 .env，並將其加入 .gitignore！"
    )
    goals = [
        "自全量歷史中抹除 .env 檔案",
        "將 .env 加入 .gitignore 提交防護",
        "確認 git log --all -- .env 毫無紀錄"
    ]
    next_steps = [
        "清洗歷史：git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty -- --all",
        "加入忽略：echo '.env' >> .gitignore",
        "提交忽略：git add .gitignore && git commit -m 'chore: ignore .env'",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "可以使用 git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty -- --all 清洗全量歷史。",
        "完成後建立 .gitignore 檔案並寫入 .env，最後 git commit -m 'chore: ignore .env'。",
        "輸入 ./git-lab verify 驗收成果！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('init')\n", "feat: init repo")

        # Accidental commit with secret
        engine.commit_file(".env", "AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE\n", "feat: add config")

        # Subsequent commits
        engine.commit_file("dash.py", "print('dashboard')\n", "feat: add dashboard")
        engine.commit_file("app.py", "print('ready')\n", "feat: update app")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if .env is in git log --all -- .env
        code, log_out, _ = engine.run_git("log", "--all", "--", ".env", check=False)
        if log_out.strip():
            return False, "提交歷史中仍找得到 .env 的提交紀錄！請徹底自歷史中抹除。"

        # Check .gitignore exists in HEAD and contains .env
        if not engine.file_exists(".gitignore"):
            return False, "尚未建立 .gitignore 檔案以防止未來再次誤傳！"

        git_ignore_content = (engine.workspace / ".gitignore").read_text(encoding="utf-8")
        if ".env" not in git_ignore_content:
            return False, ".gitignore 中未包含 .env 忽略規則！"

        return True, "太棒了！你化解了高危險資安事故，徹底消除了歷史中殘留的敏感金鑰！"
