"""Scenario 08: Reflog disaster recovery."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario08(BaseScenario):
    id = "08"
    title = '誤刪提交：Reflog 救援'
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "本來只想退回暫存，你手抖敲成了 git reset --hard HEAD~1，剛寫了一整個下午的核心功能直接蒸發！\n"
        "你背後直冒冷汗、心跳飆破 180，心中開始打離職信草稿……別慌！Git 有時光黑盒子日記 git reflog，\n"
        "趁前輩發現前偷偷把丟失的提交召喚回人間！"
    )
    goals = [
        "reflog 是本地引用變動記錄，會過期；無法救回從未提交或已清除的物件",
        "執行 git log，體會重要 Commit 與檔案完全失蹤的危機狀態",
        "執行 git reflog，檢視本機所有 HEAD 移動日誌，找出誤刪前的 Commit 位置",
        "使用 git reset --hard HEAD@{1}（或該 Commit 的 7 碼 hash）回到手滑前那一刻",
        "確認 migration.py 與 report.py 完整復活！"
    ]
    next_steps = [
        "確認災情：git log --oneline (確認 commit 確實消失)",
        "查看操作紀錄黑盒子：git reflog",
        "找出手滑前的紀錄點 (通常在 reset 之前，例如 HEAD@{1})",
        "救援恢復：git reset --hard HEAD@{1}",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "輸入 git reflog，你會看到最近的操作，其中有一行是 reset: moving to HEAD~2。",
        "在它之前的那一行（例如 HEAD@{1}）就是你手滑前的頂點，標題為 feat: add financial reports。",
        "執行 git reset --hard HEAD@{1}（或使用該行的 7 碼 hash），遺失的所有檔案與歷史就會瞬間復活！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("db.py", "# Database connection\n", "feat: base database setup")

        # Two valuable commits
        engine.commit_file("migration.py", "def migrate(): pass\n", "feat: add database migration scripts")
        engine.commit_file("report.py", "def generate_report(): return 'OK'\n", "feat: add financial reports")

        engine.run_git("config", "lab.scenario08.saved", engine.get_head_hash())

        # Simulate disaster!
        engine.run_git("reset", "--hard", "HEAD~2")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if migration.py and report.py exist and are committed
        if not engine.file_exists("migration.py") or not engine.file_exists("report.py"):
            return False, "失蹤的檔案尚未救回！請使用 git reflog 找回手滑前包含 report.py 與 migration.py 的 Commit。"

        code, out, _ = engine.run_git("log", "--oneline", "-5", check=False)
        if "financial reports" not in out:
            return False, "歷史紀錄中尚未看見 'feat: add financial reports' 的 Commit，請確認是否已 hard reset 回正確的 Commit 節點。"

        count = engine.get_commit_count()
        if count < 3:
            return False, f"目前分支上只有 {count} 個 Commit，尚未回到包含完整 3 個 Commit 的狀態。"

        _, saved, _ = engine.run_git("config", "--get", "lab.scenario08.saved", check=False)
        if engine.get_head_hash() != saved.strip():
            return False, "請用 reflog 救回原本提交，不是另造同名訊息。"
        return True, "奇蹟生還！你掌握了 Git 世界最強大的後悔藥 git reflog，reflog 僅限本地且有保留期限；已清除或從未提交的內容無法保證救回。"
