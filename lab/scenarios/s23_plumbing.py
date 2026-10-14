"""Scenario 23: Exploring Git plumbing objects with git cat-file."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario23(BaseScenario):
    id = "23"
    title = '探索物件：Commit、Tree 與 Blob'
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "強哥對你說：「如果你只會 add 和 commit，那你只是個打字機；懂了 .git 物件資料庫，你才真正懂 Git。」\n"
        "請化身底層駭客，用水管指令 git cat-file 剖析 blob、tree 與 commit 物件的真實結構，讓前輩對你刮目相看！"
    )
    goals = [
        "使用 git cat-file -t HEAD 驗證 HEAD 的物件型別為 commit",
        "使用 git cat-file -p HEAD 檢視提交物件結構，並找出 tree 的物件 ID（預設 SHA-1；可選 SHA-256 儲存庫）",
        "使用 git cat-file -p <tree_hash> 檢視該目錄樹中的 app.py 指向的 blob hash",
        "使用 git cat-file -p <blob_hash> 直接印出 app.py 的原始檔案內容",
        "將探索結果寫入 inspection.txt 完成底層通關認證"
    ]
    next_steps = [
        "查看 HEAD 的物件型別：git cat-file -t HEAD",
        "傾印 HEAD 的提交內容：git cat-file -p HEAD",
        "取得 tree hash（第一行的 tree 後方字串）",
        "傾印 tree 內容：git cat-file -p <tree_hash>",
        "傾印 blob 內容：git cat-file -p <blob_hash>",
        "將該 blob hash 寫入驗收檔案：echo '<blob_hash>' > inspection.txt",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "-t 參數代表 type（物件型態：commit, tree, blob, tag）。",
        "-p 參數代表 pretty-print（以人類可讀格式排版印出內容）。",
        "也可以一行指令抓取 blob hash：git ls-tree HEAD app.py | awk '{print $3}' > inspection.txt。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 建立具備獨特內容的檔案
        app_file = engine.workspace / "app.py"
        app_file.write_text("SECRET_DATABASE_PAYLOAD = 'VAULT_CORE_778899'\n", encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: scaffold core vault secret")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 計算 app.py 的正確 blob hash
        _, ls_out, _ = engine.run_git("ls-tree", "HEAD", "app.py")
        parts = ls_out.strip().split()
        if len(parts) < 3:
            return False, "無法在 HEAD 找到 app.py 物件！"
        expected_blob_hash = parts[2]

        # 2. 檢查 inspection.txt 是否存在並包含正確的 blob hash
        inspect_file = engine.workspace / "inspection.txt"
        if not inspect_file.exists():
            return False, f"尚未找到 inspection.txt！請將你透過 git cat-file 探測到的 app.py blob hash ({expected_blob_hash[:7]}...) 寫入 inspection.txt。"

        user_content = inspect_file.read_text(encoding="utf-8").strip()
        if expected_blob_hash not in user_content and expected_blob_hash[:7] not in user_content:
            return False, f"inspection.txt 中的 hash 不正確！預期的 app.py blob hash 應為 '{expected_blob_hash}'。"

        return True, "🎉 嘆為觀止！你成功解構了 Git 的底層物件儲存模型 (Object Database)，從 Commit ➜ Tree ➜ Blob 摸透了版本控制的物理本質！"
