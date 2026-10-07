"""Scenario 17: Reusing recorded conflict resolutions with git rerere."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

BASE_SERVER_CODE = '''# API Gateway Core
API_VERSION = "1.0"


def route_request(path):
    return f"Base handler for {path}"
'''

FEATURE_SERVER_CODE = '''# API Gateway Core (FastAPI Modern Standard)
API_VERSION = "2.0-async"


def route_request(path):
    return f"Async FastAPI handler for {path}"
'''

MAIN_SERVER_CODE = '''# API Gateway Core (Enterprise Long Term Support)
API_VERSION = "1.5-LTS"


def route_request(path):
    return f"Enterprise LTS handler for {path}"
'''

class Scenario17(BaseScenario):
    id = "17"
    title = "重複衝突終結者：git rerere 記錄與自動重用解法"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "在長期維護的分支上進行多次 Rebase 或跨分支合併時，最讓人崩潰的就是：\n"
        "同一個衝突在 Step 1 解過一次，Step 2 Rebase 又遇到一模一樣的衝突，還要再手動解一次！\n"
        "Git 內建的秘密武器是 `rerere`（Reuse Recorded Resolution，重用已記錄的衝突解法）。\n"
        "啟用後，Git 會在 `.git/rr-cache` 自動記憶你如何解決衝突。下一次遇到完全相同的衝突區塊時，直接自動填入解法！"
    )
    goals = [
        "啟用 rerere 機制：git config rerere.enabled true",
        "嘗試合併 feature/modern-api 分支並觸發衝突",
        "手動解決 server.py 中的衝突並完成合併 Commit",
        "觀察 Git 自動記錄衝突解決狀態 (Recorded resolution for 'server.py')",
        "理解 rerere 在多步驟 Rebase 或長壽分支中的神級省時價值"
    ]
    next_steps = [
        "查看指引：cat RERERE_GUIDE.md",
        "開啟 rerere 配置：git config rerere.enabled true",
        "執行合併觸發衝突：git merge feature/modern-api",
        "手動解決 server.py 中的衝突標記",
        "暫存並提交：git add server.py && git commit -m 'merge: resolve server.py with rerere'",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "務必先執行 git config rerere.enabled true，這樣 Git 才能在衝突發生當下建立記錄點。",
        "解決衝突時，請刪除 <<<<<<<, =======, >>>>>>> 等標記，保留正常的 Python 語法。",
        "完成提交後，可以檢查 .git/rr-cache/ 目錄，會發現 Git 已經將你的解決方案快取起來了。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 建立 main 基底
        server_path = engine.workspace / "server.py"
        server_path.write_text(BASE_SERVER_CODE, encoding="utf-8")
        engine.run_git("add", "server.py")
        engine.run_git("commit", "-m", "feat: initial api gateway core")

        # 2. 開出 feature/modern-api 分支並修改
        engine.run_git("switch", "-c", "feature/modern-api")
        server_path.write_text(FEATURE_SERVER_CODE, encoding="utf-8")
        engine.run_git("add", "server.py")
        engine.run_git("commit", "-m", "feat: upgrade gateway to async fastapi")

        # 3. 切回 main 分支並產生衝突修改
        engine.run_git("switch", "main")
        server_path.write_text(MAIN_SERVER_CODE, encoding="utf-8")
        engine.run_git("add", "server.py")
        engine.run_git("commit", "-m", "feat: update gateway to LTS enterprise release")

        # 4. 建立指引文件
        guide_path = engine.workspace / "RERERE_GUIDE.md"
        guide_path.write_text(
            "# 🎯 Level 17：Git Rerere 終結重複衝突指南\n\n"
            "## 什麼是 rerere？\n"
            "`rerere` 代表 **Reuse Recorded Resolution**（重用已記錄的解決方案）。\n"
            "當你在一個大分支做 Rebase（例如跨了 10 個 commit），同一個衝突可能要解 10 次！\n"
            "開啟 `rerere` 後，你只要解第 1 次，後面的 9 次 Git 就會自動套用你的解法！\n\n"
            "## 操作步驟：\n"
            "1. 啟用 rerere：\n"
            "   ```bash\n"
            "   git config rerere.enabled true\n"
            "   ```\n"
            "2. 合併觸發衝突：\n"
            "   ```bash\n"
            "   git merge feature/modern-api\n"
            "   ```\n"
            "   （Git 會提示：`Recorded preimage for 'server.py'`）\n\n"
            "3. 編輯 `server.py`，解決衝突標記。\n"
            "4. 暫存並提交：\n"
            "   ```bash\n"
            "   git add server.py\n"
            "   git commit -m 'merge: resolve server.py with rerere'\n"
            "   ```\n"
            "   （Git 會提示：`Recorded resolution for 'server.py'`）\n\n"
            "5. 驗收成果：\n"
            "   ```bash\n"
            "   ./git-lab verify\n"
            "   ```\n",
            encoding="utf-8"
        )

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查 rerere.enabled 配置
        _, out_cfg, _ = engine.run_git("config", "rerere.enabled", check=False)
        if out_cfg.strip().lower() != "true":
            return False, "尚未啟用 rerere！請執行 `git config rerere.enabled true`。"

        # 2. 檢查 server.py 是否包含未解決的衝突標記
        server_path = engine.workspace / "server.py"
        if not server_path.exists():
            return False, "找不到 server.py 檔案！"

        content = server_path.read_text(encoding="utf-8")
        if "<<<<<<<" in content or ">>>>>>>" in content or "=======" in content:
            return False, "server.py 中依然包含未解決的衝突標記！請手動編輯檔案並移除標記。"

        # 3. 檢查工作區是否乾淨
        _, out_status, _ = engine.run_git("status", "--porcelain", check=False)
        dirty = [l for l in out_status.splitlines() if "server.py" in l]
        if dirty:
            return False, "工作區尚有未提交的改動，請執行 `git add server.py && git commit` 完成合併。"

        # 4. 檢查最新 commit 是否為 Merge Commit
        _, out_parents, _ = engine.run_git("rev-list", "--parents", "-n", "1", "HEAD", check=False)
        parents = out_parents.strip().split()
        if len(parents) < 3:
            return False, "最新提交不是 Merge Commit！請確認是否成功執行了 `git merge feature/modern-api`。"

        return True, (
            "🎉 恭喜通關！你解鎖了 Git 最被低估的黑魔法：`git rerere`！\n"
            "從此以後，無論是長期特徵分支的多次變基，還是複雜的交叉合併，"
            "相同的衝突只要手動解一次，Git 就會永遠記住你的解法並全自動重用！"
        )
