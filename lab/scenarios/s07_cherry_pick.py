"""Scenario 07: Cherry-picking a specific commit across branches."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

SECURITY_CODE = '''# Security Hardening
def sanitize_input(user_input):
    return user_input.replace("<script>", "").replace("</script>", "")
'''

class Scenario07(BaseScenario):
    id = "07"
    title = "精準挑選：跨分支 Cherry-pick 偷渡關鍵 Commit"
    difficulty = "實戰 ⭐⭐⭐"
    story = (
        "同事在龐大且未完成的實驗分支 experiment-v2 上，順手修復了一個嚴重的安全漏洞。\n"
        "因為 experiment-v2 上充斥著未測試的半成品，絕對不能把整個分支 merge 進 main！\n"
        "產品經理要求你：在 main 分支上，只把修復安全漏洞的那一個 Commit「摘取 (cherry-pick)」過來！"
    )
    goals = [
        "使用 git log --oneline experiment-v2 查看實驗分支，找出帶有 security 的 Commit Hash",
        "確認自己位於 main 分支",
        "執行 git cherry-pick <commit-hash> 將該修復 Commit 單獨套用至 main",
        "確認安全修復 security.py 存在，且完全沒有引入其他半成品檔案！"
    ]
    next_steps = [
        "檢視實驗分支歷史：git log --oneline experiment-v2",
        "確認自己在 main：git checkout main",
        "精準移植：git cherry-pick <commit-hash>",
        "確認狀態：git status",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "先輸入 git log --oneline experiment-v2，找到標題為 fix: patch critical security bug 的那行，複製開頭的 7 碼 hash。",
        "確認你在 main 分支：輸入 git checkout main。",
        "執行 git cherry-pick <剛剛複製的hash>，Git 就會將該變更單獨提交在 main 上！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)
        engine.run_git("branch", "-D", "experiment-v2", check=False)

        # Base commit on main
        engine.commit_file("app.py", "print('App running')\n", "feat: base stable app")

        # Create experiment branch with 3 commits
        engine.run_git("checkout", "-b", "experiment-v2")
        engine.commit_file("unstable_ui.py", "# unstable\n", "feat: experimental ui revamp")
        engine.commit_file("security.py", SECURITY_CODE, "fix: patch critical security bug")
        engine.commit_file("unstable_ai.py", "# unfinished ai\n", "feat: experimental ai assistant")

        # Switch back to main for user
        engine.run_git("checkout", "main")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        branch = engine.get_current_branch()
        if branch != "main":
            return False, f"目前所在分支為 '{branch}'，請切換至 'main' 分支再進行驗證。"

        if (engine.repo_dir / ".git" / "CHERRY_PICK_HEAD").exists():
            return False, "Cherry-pick 尚未完成，可能發生衝突或尚未完成提交。"

        # Check security.py exists
        if not engine.file_exists("security.py"):
            return False, "main 分支尚未包含 security.py，請確認是否已正確 cherry-pick 修復 commit。"

        # Check unstable files do NOT exist
        if engine.file_exists("unstable_ui.py") or engine.file_exists("unstable_ai.py"):
            return False, "警告！main 分支包含了 experiment-v2 的半成品檔案！請注意任務要求是「單獨摘取」，而不是整個 merge。"

        code, out, _ = engine.run_git("log", "-1", "--pretty=%B", check=False)
        if "security" not in out.lower():
            return False, "最新 Commit 似乎不是安全修復的 Commit。"

        return True, "乾淨俐落！你成功運用 git cherry-pick 達成了精準移植特定變更的高級操作！"
