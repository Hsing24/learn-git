"""Scenario 33: Purging Secrets from Git History."""

import shutil
import tempfile
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario33(BaseScenario):
    id = "33"
    title = "密鑰已經推上遠端的事故處理"
    difficulty = "進階 ⭐⭐⭐⭐⭐"
    story = (
        "同事 3 個 commit 前不小心將包含 AWS 密鑰的 .env 提交並推送到遠端！\n"
        "第一步必須先到憑證服務撤銷並輪替密鑰；改寫 Git 歷史不會讓已外洩的密鑰失效。\n"
        "確認完成後，請清除本機與遠端歷史、加入 .gitignore，並通知團隊丟棄舊 clone、重新 clone。"
    )
    goals = [
        "撤銷並輪替外洩密鑰後，記錄確認：git config lab.secret-rotation-confirmed yes",
        "自全量歷史中抹除 .env，並刪除 filter-branch 備份 refs",
        "將 .env 加入 .gitignore 並提交",
        "以原遠端 tip 為租約安全推送，驗證本機與遠端歷史和 main 一致"
    ]
    next_steps = [
        "先在憑證服務撤銷並輪替密鑰；完成後記錄確認：git config lab.secret-rotation-confirmed yes",
        "檢查工具：git filter-repo --version。若已安裝，使用 git filter-repo --path .env --invert-paths",
        "若未安裝，可使用 filter-branch 清理：git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty -- --all",
        "刪除 filter-branch 備份 refs：git for-each-ref --format='delete %(refname)' refs/original/ | git update-ref --stdin",
        "清理 reflog 與無引用物件：git reflog expire --expire=now --all && git gc --prune=now",
        "確認本機沒有舊歷史：git log --all -- .env",
        "加入忽略並提交：echo '.env' >> .gitignore && git add .gitignore && git commit -m 'chore: ignore .env'",
        "若 origin 被 filter-repo 移除，從預存 URL 還原：git remote get-url origin || git remote add origin \"$(git config --get lab.secret-purge-remote-url)\"",
        "以 setup 時的遠端 tip 為租約安全推送：git push --force-with-lease=refs/heads/main:$(git config --get lab.secret-purge-remote-main) origin main",
        "驗收成果：../git-lab verify",
        "通知團隊丟棄舊 clone 並重新 clone；不要讓舊 refs 再推回已清理的歷史。",
        "真實託管平台可能保留 PR refs、快取或其他副本；依平台的敏感資料清除流程申請清理。"
    ]
    hints = [
        "先到憑證服務撤銷並輪替密鑰，再輸入 git config lab.secret-rotation-confirmed yes 記錄確認。Git 歷史清理不能撤銷憑證。",
        "優先使用 git filter-repo；它可能移除 origin，遠端 URL 與舊 main tip 已存於本機 Git config。",
        "filter-branch 會留下 refs/original 備份，必須刪除 refs/original、清理 reflog 並執行 gc，否則 --all 仍看得到舊 .env。",
        "重寫完成後用明確的 --force-with-lease OID 推送，並通知同事停止舊 clone、重新 clone。",
        "託管服務可能還有 PR refs、快取或其他 clone；Git push 不會清理這些副本，請依服務商流程處理。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        remote_path = engine.project_root / ".git-lab-remote-33"
        if remote_path.exists():
            shutil.rmtree(remote_path, ignore_errors=True)
        remote_path.mkdir(parents=True, exist_ok=True)
        engine.run_git("-C", str(remote_path), "init", "--bare", "-b", "main")

        # Seed the remote, then give the learner a fresh clone to rewrite.
        with tempfile.TemporaryDirectory(prefix="git-lab-secret-seed-") as seed_dir_name:
            seed_dir = Path(seed_dir_name)
            engine.run_git("init", "-b", "main", cwd=seed_dir)
            seed_commits = [
                ("app.py", "print('init')\n", "feat: init repo"),
                (".env", "AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE\n", "feat: add config"),
                ("dash.py", "print('dashboard')\n", "feat: add dashboard"),
                ("app.py", "print('ready')\n", "feat: update app"),
            ]
            for filename, content, message in seed_commits:
                (seed_dir / filename).write_text(content, encoding="utf-8")
                engine.run_git("add", filename, cwd=seed_dir)
                engine.run_git("commit", "-m", message, cwd=seed_dir)
            engine.run_git("remote", "add", "origin", str(remote_path), cwd=seed_dir)
            engine.run_git("push", "origin", "main", cwd=seed_dir)

        remote_head_code, remote_head, _ = engine.run_git(
            "-C", str(remote_path), "rev-parse", "refs/heads/main", check=False
        )
        if remote_head_code != 0:
            raise RuntimeError("無法建立密鑰清除練習的遠端 main。")

        shutil.rmtree(engine.workspace_dir, ignore_errors=True)
        engine.run_git(
            "clone", "--no-local", str(remote_path), str(engine.workspace_dir),
            cwd=engine.project_root,
        )
        engine._ensure_workspace_symlink()
        # filter-repo's fresh-clone check rejects even ignored untracked files.
        # Remove the lab launcher symlink while rewriting; ../git-lab remains available.
        launcher = engine.workspace / "git-lab"
        if launcher.is_symlink():
            launcher.unlink()
        engine.run_git("config", "lab.secret-purge-remote-url", str(remote_path))
        engine.run_git("config", "lab.secret-purge-remote-main", remote_head.strip())

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        code, rotation_confirmation, _ = engine.run_git(
            "config", "--get", "lab.secret-rotation-confirmed", check=False
        )
        if code != 0 or rotation_confirmation.strip().lower() != "yes":
            return False, "尚未確認已在憑證服務撤銷並輪替密鑰！請完成後執行 git config lab.secret-rotation-confirmed yes。"

        # Check if .env is in git log --all -- .env
        code, log_out, _ = engine.run_git("log", "--all", "--", ".env", check=False)
        if log_out.strip():
            return False, "提交歷史中仍找得到 .env 的提交紀錄！請徹底自歷史中抹除。"

        code, git_ignore_content, _ = engine.run_git("show", "HEAD:.gitignore", check=False)
        if code != 0 or ".env" not in {line.strip() for line in git_ignore_content.splitlines()}:
            return False, ".gitignore 中未包含 .env 忽略規則！"

        if engine.file_exists(".env"):
            return False, "工作目錄仍留有 .env 密鑰檔案！請安全移除本機明文副本。"

        code, remote_url, _ = engine.run_git("config", "--get", "lab.secret-purge-remote-url", check=False)
        if code != 0 or not remote_url.strip():
            return False, "找不到練習遠端 URL，無法確認遠端歷史。"
        remote_path = Path(remote_url.strip())

        code, remote_log, _ = engine.run_git(
            "-C", str(remote_path), "log", "--all", "--", ".env", check=False
        )
        if code != 0 or remote_log.strip():
            return False, "遠端 refs 仍能找到 .env 歷史！請確認安全強推已更新遠端 main。"

        code, local_head, _ = engine.run_git("rev-parse", "HEAD", check=False)
        remote_code, remote_head, _ = engine.run_git(
            "-C", str(remote_path), "rev-parse", "refs/heads/main", check=False
        )
        if remote_code != 0 or code != 0 or local_head.strip() != remote_head.strip():
            return False, "本機 HEAD 尚未與遠端 main 同步；請使用預存 OID 執行 --force-with-lease 推送。"

        for filename, expected in {
            "app.py": "print('ready')\n",
            "dash.py": "print('dashboard')\n",
        }.items():
            code, local_content, _ = engine.run_git("show", f"HEAD:{filename}", check=False)
            if code != 0 or local_content != expected:
                return False, f"清洗後的歷史應保留 {filename} 原有內容。"

        return True, "太棒了！你先輪替憑證，再清理本機與遠端 refs、加入防護並同步歷史。現在請要求團隊棄用舊 clone，重新 clone。"
