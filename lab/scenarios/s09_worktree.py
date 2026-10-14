"""Scenario 09: Parallel Development with Git Worktree (No-Stash Workflow)."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

SERVER_BUGGY_CODE = '''# Production Server
def handle_request():
    status = "CRASH: division by zero"
    return status
'''

SERVER_FIXED_CODE = '''# Production Server
def handle_request():
    status = "OK 200: healthy response"
    return status
'''

class Scenario09(BaseScenario):
    id = "09"
    title = '平行修復：Worktree 獨立工作區'
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "你在主工作區正改得一頭熱，環境都跑起來了，主管突然衝進來：「線上 Emergency P0 事故！立刻修！」\n"
        "不想用 stash 搞亂工作區重新編譯，資深前輩傳授密技：\n"
        "用 git worktree 開啟第二工作目錄並行救援，秒速修完 hotfix 瀟灑閃人！"
    )
    goals = [
        "理解現代前端/後端專案中 git worktree 與 git stash 的核心定位與選擇時機",
        "確認自己在 feature-ai 分支上，保留未完成的 ai_notes.txt 草稿狀態",
        "使用 git worktree add hotfix-dir -b hotfix-p0 main 建立獨立平行目錄",
        "進入 hotfix-dir 目錄，將 server.py 的錯誤修復為正常狀態並完成 Commit",
        "返回原目錄，使用 git worktree list 檢視所有現存的工作樹",
        "切換回 main 分支將 hotfix-p0 合併，最後使用 git worktree remove hotfix-dir 乾淨清理！"
    ]
    next_steps = [
        "查看當前狀態：git status",
        "建立平行工作樹：git worktree add hotfix-dir -b hotfix-p0 main",
        "進入熱修復目錄：cd hotfix-dir",
        "修復 server.py 並提交：git add server.py && git commit -m \"fix: emergency patch for p0 bug\"",
        "切回原目錄：cd ..",
        "切回 main 並合併：git checkout main && git merge hotfix-p0",
        "清理臨時工作樹：git worktree remove hotfix-dir",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "【何時用 Worktree vs. 何時用 Stash？】\n"
        "• 使用 git worktree：跨分支平行開發、緊急 Hotfix、Code Review、減少切換原目錄造成的環境干擾；新目錄的依賴仍需自行管理。\n"
        "• 使用 git stash：同一分支內 < 5 分鐘的臨時小暫存、快速 pull 遠端代碼。\n"
        "建立新工作樹指令：git worktree add hotfix-dir -b hotfix-p0 main（這會在當前目錄下建立 hotfix-dir 資料夾，並檢出 hotfix-p0 分支）。",
        "進入 hotfix-dir 後，編輯 server.py 將 status 改為正常，再執行 git commit 完成提交。",
        "完成後 cd .. 回到上一層，切換到 main 分支執行 git merge hotfix-p0，最後執行 git worktree remove hotfix-dir 即可！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit on main
        engine.commit_file("server.py", SERVER_BUGGY_CODE, "feat: production server v1.0")

        # Create feature-ai branch with WIP
        engine.run_git("checkout", "-b", "feature-ai")
        engine.commit_file("ai_model.py", "class AIRecommendation:\n    pass\n", "feat: start ai model")
        # Leave a dirty untracked draft in feature-ai
        engine.create_file("ai_notes.txt", "TODO: pending hyperparameter tuning\n")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if main contains the fix
        code, out, _ = engine.run_git("show", "main:server.py", check=False)
        if "OK 200" not in out:
            return False, "main 分支上的 server.py 尚未包含修復內容，請確認已合併 hotfix-p0 分支。"

        # Check feature-ai still exists
        code, out, _ = engine.run_git("branch", check=False)
        if "feature-ai" not in out:
            return False, "feature-ai 分支遺失，請確認保留了原有的功能分支。"

        # Check worktree cleanup
        code, out, _ = engine.run_git("worktree", "list", check=False)
        if "hotfix-dir" in out:
            return False, "臨時工作樹 hotfix-dir 尚未清理，請執行 git worktree remove hotfix-dir。"

        if engine.read_file("ai_notes.txt") != "TODO: pending hyperparameter tuning\n":
            return False, "原有 ai_notes.txt 草稿遺失，worktree 修復須保留 feature WIP。"
        code, _, _ = engine.run_git("merge-base", "--is-ancestor", "hotfix-p0", "main", check=False)
        if code != 0:
            return False, "main 必須合併 hotfix-p0 的修復提交。"
        return True, "太強了！你掌握了專業團隊必備的 git worktree，清楚分清 worktree 與 stash 的現代應用時機，實現從容優雅的平行開發！"
