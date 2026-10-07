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
    title = "雙軌並行：Git Worktree 免 Stash 零干擾平行開發"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "你正在分支 feature-ai 上開發大型推薦系統，工作區裡充斥著未完成的草稿代碼與測試快取。\n"
        "突然間！線上伺服器爆發緊急 P0 故障！主管要求你立刻切回 main 開發熱修復 (Hotfix)。\n"
        "但你的 feature-ai 正在運算，不想 git stash 冒衝突風險，也不想破壞 IDE 專案索引。\n"
        "業界高手的極速解法：使用 git worktree 在獨立目錄開闢第二工作樹，零干擾平行開發！"
    )
    goals = [
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

        return True, "太強了！你掌握了專業團隊必備的 git worktree，從此告別繁瑣的 git stash，實現從容優雅的平行開發！"
