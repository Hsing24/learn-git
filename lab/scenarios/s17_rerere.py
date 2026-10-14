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
    title = '重複衝突：Rerere 記錄與重用'
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "你在長期分支上每天早上 pull 或 rebase 都得手動解同一批衝突，解到懷疑人生。\n"
        "資深前輩看不下去，指點你開啟黑科技 git rerere——\n"
        "讓 Git 自動記憶衝突解法，從此自動秒解重複衝突！"
    )
    goals = [
        "啟用 rerere 機制：git config rerere.enabled true",
        "嘗試合併 feature/modern-api 分支並觸發衝突",
        "手動解決 server.py 中的衝突並完成合併 Commit",
        "觀察 Git 自動記錄衝突解決狀態 (Recorded resolution for 'server.py')",
        "在 retry 分支從 main-before 重演相同衝突，確認 Git 重用解法，再 add/commit"
    ]
    next_steps = [
        "查看指引：cat RERERE_GUIDE.md",
        "開啟 rerere 配置：git config rerere.enabled true",
        "執行合併觸發衝突：git merge feature/modern-api",
        "手動解決 server.py 中的衝突標記",
        "暫存並提交：git add server.py && git commit -m 'merge: resolve server.py with rerere'",
        "git switch -c retry main-before，再 git merge feature/modern-api",
        "確認 server.py 已自動套用同一解法，再 git add server.py、git commit --no-edit",
        "git switch main，驗收成果：./git-lab verify"
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

        engine.run_git("branch", "main-before")

        # 4. 建立指引文件
        guide_path = engine.workspace / "RERERE_GUIDE.md"
        guide_path.write_text(
            "# 🎯 Level 17：Git Rerere 終結重複衝突指南\n\n"
            "## 什麼是 rerere？\n"
            "`rerere` 代表 **Reuse Recorded Resolution**（重用已記錄的解決方案）。\n"
            "當你在一個大分支做 Rebase（例如跨了 10 個 commit），同一個衝突可能要解 10 次！\n"
            "啟用後先記錄正確解法；只有再次遇到可匹配的衝突，Git 才會重用。重用後仍須檢查內容與暫存。\n\n"
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
            "5. 重演：git switch -c retry main-before，再 git merge feature/modern-api。Git 仍可能以衝突退出碼停下，但工作目錄已重用解法；檢查後 add/commit，再 switch main。\n"
            "6. 驗收成果：\n"
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

        if engine.get_current_branch() != "main" or (engine.workspace / ".git/MERGE_HEAD").exists():
            return False, "請完成重演合併後切回 main。"
        code, retry_tree, _ = engine.run_git("rev-parse", "retry^{tree}", check=False)
        _, main_tree, _ = engine.run_git("rev-parse", "main^{tree}", check=False)
        _, retry_parents, _ = engine.run_git("rev-list", "--parents", "-n", "1", "retry", check=False)
        cache = engine.workspace / ".git/rr-cache"
        records = list(cache.glob("*/postimage")) if cache.exists() else []
        if code != 0 or retry_tree != main_tree or len(retry_parents.split()) != 3 or not records:
            return False, "請從 main-before 在 retry 重演，重用記錄解法並完成相同 tree 的合併。"
        if not any(p.read_text() == content for p in records):
            return False, "rerere cache 必須記錄目前 server.py 的解法。"
        return True, "已記錄並在 retry 的相同衝突重用解法；仍須檢查與暫存，cache 也可能被清理。"
