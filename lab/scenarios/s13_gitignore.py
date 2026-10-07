"""Scenario 13: Untracking files with git rm --cached and fixing .gitignore."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario13(BaseScenario):
    id = "13"
    title = "亡羊補牢：.gitignore 追蹤失效救援與 git rm --cached"
    difficulty = "初階 ⭐⭐"
    story = (
        "全宇宙工程師最常踩的坑之一：不小心把 `.env`（內含資料庫密碼或 API 金鑰）或 `build/` 目錄 commit 進了版本庫。\n"
        "事後雖然在 `.gitignore` 補寫上了 `.env`，卻發現每次修改檔案，Git 依然緊追不捨！\n"
        "這是因為：**『已被版本庫追蹤的檔案，不受 .gitignore 規則約束』**！\n"
        "要解決這個問題，必須使用 `git rm --cached` 將檔案從 Git 暫存區與索引中除名，同時確保本地硬碟上的實體檔案安然無恙！"
    )
    goals = [
        "確認 .env 檔案已被 Git 錯誤納入版本控管 (使用 git ls-files)",
        "建立 .gitignore 檔案並在其中寫入 .env",
        "使用 git rm --cached .env 將其從 Git 追蹤名單中除名（保留本地檔案）",
        "提交修改：將 .gitignore 與移除追蹤的變更寫入 Commit",
        "確認本地 .env 實體檔案依然完好，且 git status 呈現乾淨狀態"
    ]
    next_steps = [
        "檢查當前被追蹤的狀態：git ls-files .env",
        "建立 .gitignore 並加入 .env：echo '.env' >> .gitignore",
        "從 Git 索引中移除追蹤：git rm --cached .env",
        "檢查狀態：git status",
        "提交變更：git add .gitignore && git commit -m 'chore: stop tracking .env and add to .gitignore'",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "千萬記得加上 --cached！如果不加 --cached，git rm .env 會直接刪除你的本地實體檔案！",
        "如果專案累積了大量被追蹤的暫存檔或編譯輸出，業界常用重洗大招是：git rm -r --cached . && git add . && git commit。",
        "驗收前請確保已執行 git commit，讓工作區維持乾淨。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 建立應用程式代碼與被誤追蹤的 .env
        app_path = engine.workspace / "app.py"
        app_path.write_text(
            "import os\n\n"
            "print('Starting Server with DB connection...')\n",
            encoding="utf-8"
        )

        env_path = engine.workspace / ".env"
        env_path.write_text(
            "# ⚠️ 絕對機密！不可推送到公開代碼庫！\n"
            "DATABASE_URL=\"postgres://admin:super_secret_password_999@localhost:5432/prod_db\"\n"
            "API_SECRET_KEY=\"sk_live_99887766554433221100\"\n",
            encoding="utf-8"
        )

        # 2. 將兩者加入並提交，模擬新手誤提交機密檔案的情境
        engine.run_git("add", "app.py", ".env")
        engine.run_git("commit", "-m", "feat: initial commit with app and env")

        # 3. 建立指南文件
        guide_path = engine.workspace / "GITIGNORE_GUIDE.md"
        guide_path.write_text(
            "# 🎯 Level 13：.gitignore 失效救援指南\n\n"
            "## 為什麼 .gitignore 沒效？\n"
            "當一個檔案已經被 `git add` 並 `commit` 過後，Git 內部已經在索引中追蹤它了。\n"
            "此時即使你在 `.gitignore` 加上它，Git 依然會繼續追蹤其修改。\n\n"
            "## 正確救援三步驟：\n"
            "1. 建立 `.gitignore`：\n"
            "   ```bash\n"
            "   echo '.env' >> .gitignore\n"
            "   ```\n"
            "2. 僅從 Git 索引移除追蹤（保留本機檔案）：\n"
            "   ```bash\n"
            "   git rm --cached .env\n"
            "   ```\n"
            "3. 提交變更：\n"
            "   ```bash\n"
            "   git add .gitignore\n"
            "   git commit -m 'chore: stop tracking .env'\n"
            "   ```\n"
            "4. 驗收成果：\n"
            "   ```bash\n"
            "   ./git-lab verify\n"
            "   ```\n",
            encoding="utf-8"
        )

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查 .gitignore 是否存在且包含 .env
        gitignore_path = engine.workspace / ".gitignore"
        if not gitignore_path.exists():
            return False, "尚未建立 `.gitignore` 檔案！請建立並寫入 `.env`。"

        gitignore_content = gitignore_path.read_text(encoding="utf-8")
        if ".env" not in gitignore_content:
            return False, "`.gitignore` 檔案中尚未包含 `.env` 規則！請在其中加入 `.env`。"

        # 2. 檢查 .env 本地實體檔案是否依然存在
        env_path = engine.workspace / ".env"
        if not env_path.exists():
            return False, (
                "🚨 警報！本機的 `.env` 實體檔案消失了！\n"
                "你可能誤執行了 `git rm .env` 或系統 `rm .env`！\n"
                "請務必使用 `git rm --cached .env`，只除名索引而保留硬碟檔案。請輸入 `./git-lab reset 13` 重試。"
            )

        # 3. 檢查 .env 是否已從 Git 追蹤清單移除
        _, out_ls, _ = engine.run_git("ls-files", ".env", check=False)
        if out_ls.strip():
            return False, "`.env` 依然在 Git 追蹤名單中！請執行 `git rm --cached .env` 將其從索引中除名。"

        # 4. 檢查工作區是否已乾淨提交
        _, out_status, _ = engine.run_git("status", "--porcelain", check=False)
        dirty = [l for l in out_status.splitlines() if ".env" in l or ".gitignore" in l or "app.py" in l]
        if dirty:
            return False, "工作區還有未提交的修改，請使用 `git commit` 將 `.gitignore` 與除名改動寫入提交。"

        return True, (
            "🎉 完美通關！你成功掌握了 `git rm --cached` 與 `.gitignore` 的核心聯動機制！\n"
            "記住：『已追蹤的檔案不受 .gitignore 約束』。\n"
            "透過 `git rm --cached`，你可以優雅地停止追蹤檔案，同時保全本機開發所需的配置資料！"
        )
