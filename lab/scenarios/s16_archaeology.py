"""Scenario 16: Codebase archaeology with git log -S and git blame."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario16(BaseScenario):
    id = "16"
    title = "代碼考古學：git log -S 語意搜尋與 git blame 責任溯源"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "接手龐大或歷史悠久的代碼庫時，最常遇到的兩大挑戰：\n"
        "1. 某個關鍵變數或配置字串神祕失蹤，想知道『究竟是誰、在哪個 Commit 引入或刪除了它』？\n"
        "2. 看到某行奇怪的業務邏輯，想知道『當初是誰寫的、在什麼背景下被提交的』？\n"
        "盲目翻閱幾百個 commit 猶如大海撈針。\n"
        "Git 內建的考古神器：\n"
        "- **鶴嘴鎬搜尋 (Pickaxe Search: `git log -S`)**：精準揪出『改變了指定字串出現次數』的 Commit！\n"
        "- **逐行追溯 (`git blame`)**：一秒看清指定檔案每一行的作者、時間與 Commit Hash！"
    )
    goals = [
        "使用 git log -S 'CRITICAL_SECRET_TOKEN' --oneline 精確找出引入該密鑰的 Commit",
        "將該目標 Commit 的 Hash（完整或前 7 碼）寫入 ANSWER_COMMIT.txt",
        "使用 git blame database.py 觀察代碼行的作者與歷史提交",
        "掌握 git blame -w（忽略格式排版改動）的高階考古技巧"
    ]
    next_steps = [
        "查看任務指引：cat TASK.md",
        "執行鶴嘴鎬語意搜尋：git log -S 'CRITICAL_SECRET_TOKEN' --oneline",
        "記錄該 Commit Hash：echo '<目標CommitHash>' > ANSWER_COMMIT.txt",
        "逐行追溯代碼：git blame database.py",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "git log -S '字串' 只會列出實際增加或減少該字串出現次數的提交，比單純搜尋 commit 訊息精準百倍！",
        "找到 Hash 後，取出前 7 碼（或完整 hash）存入 ANSWER_COMMIT.txt 檔案即可。",
        "使用 git show <hash> 可以查看該提交當時的具體程式碼變更與上下文。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 模擬多個開發提交歷史
        db_file = engine.workspace / "database.py"
        db_file.write_text(
            "# Database connection manager\n"
            "DB_HOST = 'localhost'\n"
            "DB_PORT = 5432\n",
            encoding="utf-8"
        )
        engine.run_git("add", "database.py")
        engine.run_git("commit", "-m", "feat: scaffold database connection")

        cache_file = engine.workspace / "cache.py"
        cache_file.write_text(
            "# In-memory cache layer\n"
            "CACHE_TTL = 3600\n",
            encoding="utf-8"
        )
        engine.run_git("add", "cache.py")
        engine.run_git("commit", "-m", "feat: add caching layer")

        # 關鍵提交：注入 CRITICAL_SECRET_TOKEN
        db_file.write_text(
            "# Database connection manager\n"
            "DB_HOST = 'localhost'\n"
            "DB_PORT = 5432\n"
            "CRITICAL_SECRET_TOKEN = 'vault_master_key_888'\n",
            encoding="utf-8"
        )
        engine.run_git("add", "database.py")
        engine.run_git("commit", "-m", "feat: configure authentication secrets")

        db_file.write_text(
            "# Database connection manager\n"
            "DB_HOST = 'localhost'\n"
            "DB_PORT = 5432\n"
            "POOL_SIZE = 20\n"
            "CRITICAL_SECRET_TOKEN = 'vault_master_key_888'\n",
            encoding="utf-8"
        )
        engine.run_git("add", "database.py")
        engine.run_git("commit", "-m", "perf: optimize query pool sizing")

        # 排版變更
        db_file.write_text(
            "# Database connection manager (Production-ready)\n\n"
            "DB_HOST = 'localhost'\n"
            "DB_PORT = 5432\n"
            "POOL_SIZE = 20\n"
            "CRITICAL_SECRET_TOKEN = 'vault_master_key_888'\n",
            encoding="utf-8"
        )
        engine.run_git("add", "database.py")
        engine.run_git("commit", "-m", "style: reformat comments in database")

        metrics_file = engine.workspace / "metrics.py"
        metrics_file.write_text("ENABLE_METRICS = True\n", encoding="utf-8")
        engine.run_git("add", "metrics.py")
        engine.run_git("commit", "-m", "feat: add system metrics reporting")

        # 2. 建立任務指引
        task_path = engine.workspace / "TASK.md"
        task_path.write_text(
            "# 🔍 任務：找出歷史中的神祕密鑰提交\n\n"
            "專案中存在一個關鍵密鑰：`CRITICAL_SECRET_TOKEN`。\n"
            "請運用 Git 考古技巧回答以下問題：\n\n"
            "## 任務步驟：\n"
            "1. 使用鶴嘴鎬語意搜尋指令找出引進該 Token 的 Commit：\n"
            "   ```bash\n"
            "   git log -S 'CRITICAL_SECRET_TOKEN' --oneline\n"
            "   ```\n"
            "2. 將找到的 Commit Hash（例如 `a1b2c3d`）寫入 `ANSWER_COMMIT.txt`：\n"
            "   ```bash\n"
            "   echo '<CommitHash>' > ANSWER_COMMIT.txt\n"
            "   ```\n"
            "3. 體驗 `git blame` 查詢是誰負責維護該行配置：\n"
            "   ```bash\n"
            "   git blame database.py\n"
            "   ```\n"
            "4. 驗收成果：\n"
            "   ```bash\n"
            "   ./git-lab verify\n"
            "   ```\n",
            encoding="utf-8"
        )

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        ans_file = engine.workspace / "ANSWER_COMMIT.txt"
        if not ans_file.exists():
            return False, "尚未找到 ANSWER_COMMIT.txt 檔案！請執行 `echo '<CommitHash>' > ANSWER_COMMIT.txt`。"

        user_input = ans_file.read_text(encoding="utf-8").strip()
        if not user_input:
            return False, "ANSWER_COMMIT.txt 內容為空！請寫入找到的 Commit Hash。"

        # 查詢引入該字串的所有 commits
        _, out_res, _ = engine.run_git("log", "-S", "CRITICAL_SECRET_TOKEN", "--pretty=%H", check=False)
        target_hashes = [h.strip() for h in out_res.strip().splitlines() if h.strip()]

        # 檢查使用者的輸入是否匹配任何一個目標 hash (支援前綴匹配)
        matched = False
        for th in target_hashes:
            if th.startswith(user_input) or user_input.startswith(th[:7]):
                matched = True
                break

        if not matched:
            return False, (
                f"提交的 Hash '{user_input}' 不正確！\n"
                "提示：請執行 `git log -S 'CRITICAL_SECRET_TOKEN' --oneline`，"
                "查看哪一個 commit 真正引入了該變數。"
            )

        return True, (
            "🎉 太厲害了！你成功利用 `git log -S` (Pickaxe) 秒速鎖定了關鍵提交！\n"
            "💡 **業界考古心法**：\n"
            "- `git log -S <string>`：只搜尋『增減次數有變動』的精準提交。\n"
            "- `git log -G <regex>`：使用正則表達式搜尋代碼變動 (diff)。\n"
            "- `git blame -w <file>`：追蹤行歷史時自動忽略無關的空白排版提交，直達核心作者！"
        )
