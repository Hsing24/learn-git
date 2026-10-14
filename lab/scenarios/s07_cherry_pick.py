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
    title = '挑選修復：Cherry-pick 與衝突處理'
    difficulty = "實戰 ⭐⭐⭐"
    story = (
        "小明前輩在龐大且未完成的實驗分支 experiment-v2 上，順手修復了一個嚴重的安全漏洞。\n"
        "強哥說：「實驗分支太髒不能整支合併，菜鳥，你去把那個修復 commit 單獨夾過來！」\n"
        "請用 git cherry-pick 精準偷渡關鍵節點！"
    )
    goals = [
        "使用 git log --oneline experiment-v2 查看實驗分支，找出帶有 security 的 Commit Hash",
        "確認自己位於 main 分支",
        "執行 git cherry-pick <commit-hash> 將該修復 Commit 單獨套用至 main",
        "第一次衝突用 git cherry-pick --abort 回原狀，再重試並解決後 --continue",
        "保留 main 的 audit 註記與安全修復，且沒有半成品檔案"
    ]
    next_steps = [
        "檢視實驗分支歷史：git log --oneline experiment-v2",
        "確認自己在 main：git checkout main",
        "精準移植：git cherry-pick <commit-hash>（將出現 add/add 衝突）",
        "先練撤回：git cherry-pick --abort，再執行相同 cherry-pick",
        "編輯 security.py，保留 # Production audit 與 sanitize_input 的安全修復",
        "git add security.py，再 git cherry-pick --continue",
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
        engine.commit_file("security.py", "# Production audit\n", "feat: production audit")
        engine.run_git("config", "lab.scenario07.base", engine.get_head_hash())

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

        _, base, _ = engine.run_git("config", "--get", "lab.scenario07.base", check=False)
        _, parent, _ = engine.run_git("rev-parse", "HEAD^", check=False)
        code, committed, _ = engine.run_git("show", "HEAD:security.py", check=False)
        if parent.strip() != base.strip() or code != 0 or committed != "# Production audit\n" + SECURITY_CODE:
            return False, "請保留 main audit 與完整安全修復，僅新增一筆 cherry-pick commit。"
        if engine.read_file("security.py") != committed:
            return False, "安全修復仍有未提交變更。"
        _, reflog, _ = engine.run_git("reflog", "--format=%gs", check=False)
        if "reset: moving to" not in reflog:
            return False, "請先練習衝突的 cherry-pick --abort，然後重試並 --continue。"

        return True, "乾淨俐落！你成功運用 git cherry-pick 達成了精準移植特定變更的高級操作！"
