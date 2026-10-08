"""Scenario 23: Exploring Git plumbing objects with git cat-file."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario23(BaseScenario):
    id = "23"
    title = "底層透視：.git 水管底層物件解密 (Plumbing: cat-file & SHA-1)"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "高見龍老師《為你自己學 Git》全書最震撼的解密章節：『在 .git 目錄裡到底有什麼東西？』\n"
        "日常我們操作的 `add`, `commit`, `branch` 被稱為高階『瓷器指令 (Porcelain)』；\n"
        "而 Git 底層其實是一座精密的『內容尋址鍵值資料庫 (Content-Addressable Key-Value Store)』！\n"
        "Git 核心由四種物件 (Objects) 構成：\n"
        "1. `blob`：只存檔案內容，不存檔名\n"
        "2. `tree`：目錄結構，記錄檔名與其對應的 blob/tree SHA-1 指標\n"
        "3. `commit`：版本快照，指向一個 tree、雙親節點 (parent) 以及作者與提交訊息\n"
        "4. `tag`：標籤物件\n"
        "在本關中，你將化身 Git 內部核心黑客，透過水管底層指令 `git cat-file -t` (查型別) 與 `git cat-file -p` (傾印內容)，\n"
        "一層層順藤摸瓜，從 HEAD 穿越 tree 直達 blob 檔案本體！"
    )
    goals = [
        "使用 git cat-file -t HEAD 驗證 HEAD 的物件型別為 commit",
        "使用 git cat-file -p HEAD 檢視提交物件結構，並找出 tree 的 SHA-1 Hash",
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
