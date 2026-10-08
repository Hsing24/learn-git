"""Scenario 22: Rescuing accidental commits on main using branch and reset."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario22(BaseScenario):
    id = "22"
    title = "移花接木：錯在 main 提交的救星 (Branch & Reset 平移救援)"
    difficulty = "初階 ⭐⭐"
    story = (
        "高見龍老師《為你自己學 Git》神級救援題：『啊！我還沒開分支就直接 Commit 下去了！』\n"
        "本來預定要開新分支進行 OAuth 第三方登入功能開發，\n"
        "但你一時大意，忘了切分支，直接在穩定主線 `main` 上連續做了 2 個 commits (`oauth step 1` 與 `oauth step 2`)！\n"
        "如果直接把這兩個實驗性質的提交留在 main，會破壞團隊主線的穩定性；\n"
        "但如果直接 reset 掉，辛苦寫的心血程式碼又會付之一炬！\n"
        "這時候正是展現 Git 指針精髓的時刻——利用『原地開分支，再把主線退回去』的神級兩步，零損平移拯救歷史！"
    )
    goals = [
        "原地開出新分支 feature/oauth 承接當前進度：git branch feature/oauth",
        "確保位於 main 分支：git switch main",
        "將 main 分支指針重設回退 2 步：git reset --hard HEAD~2",
        "確認 feature/oauth 完整保留了 2 個 OAuth 提交，而 main 則重回純淨初始狀態"
    ]
    next_steps = [
        "檢視當前 main 的錯誤歷史：git log --oneline -n 3",
        "在當前位置開出新分支：git branch feature/oauth",
        "將 main 分支回退 2 步：git reset --hard HEAD~2",
        "檢視 main 的乾淨歷史：git log --oneline",
        "檢視 feature/oauth 的完整歷史：git log feature/oauth --oneline",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "Git 的分支本質只是一個指向特定 Commit 的貼紙 (Reference)！",
        "在當前 commit 下 git branch feature/oauth，新分支就會貼在當前位置；此時再將 main 退回去，就完美達成了轉移！",
        "如果不小心退錯步數，隨時可以使用 git reflog 找回。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 穩定的第一個提交
        app_file = engine.workspace / "app.py"
        app_file.write_text("print('Production Stable Server v1.0')\n", encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: stable production foundation")

        # 2. 誤在 main 上做的第 1 個 OAuth 提交
        oauth_file = engine.workspace / "oauth.py"
        oauth_file.write_text("CLIENT_ID = 'app_9988'\n", encoding="utf-8")
        engine.run_git("add", "oauth.py")
        engine.run_git("commit", "-m", "feat: oauth step 1 - add client credentials")

        # 3. 誤在 main 上做的第 2 個 OAuth 提交
        oauth_file.write_text("CLIENT_ID = 'app_9988'\ndef login_redirect(): return 'https://auth.provider.com'\n", encoding="utf-8")
        engine.run_git("add", "oauth.py")
        engine.run_git("commit", "-m", "feat: oauth step 2 - implement redirect login")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查是否存在 feature/oauth 分支
        _, branches_out, _ = engine.run_git("branch")
        branches = [b.strip().replace("*", "").strip() for b in branches_out.splitlines()]
        if "feature/oauth" not in branches:
            return False, "尚未建立 feature/oauth 分支！請在含有 oauth 提交的位置執行 git branch feature/oauth。"

        # 2. 檢查 feature/oauth 分支是否包含 oauth step 2 提交
        _, oauth_log, _ = engine.run_git("log", "feature/oauth", "--oneline")
        if "oauth step 2" not in oauth_log or "oauth step 1" not in oauth_log:
            return False, "feature/oauth 分支尚未包含完整的 2 個 OAuth 提交！"

        # 3. 檢查 main 分支是否已成功退回（只剩 1 個 commit）
        _, main_log, _ = engine.run_git("log", "main", "--oneline")
        main_commits = [l for l in main_log.splitlines() if l.strip()]
        if len(main_commits) != 1:
            return False, f"main 分支目前仍有 {len(main_commits)} 個 Commit！請切回 main 並使用 git reset --hard HEAD~2 回退 2 步。"
        if "oauth" in main_log:
            return False, "main 分支中依然殘留 oauth 提交！請確認是否已將 main 回退。"

        return True, "🎉 神級平移！你完全掌握了 Git 分支指針貼紙的本質，一秒化解了誤在主線開發的大災難，程式碼零丟失、主線零污染！"
