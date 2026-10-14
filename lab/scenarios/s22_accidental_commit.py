"""Scenario 22: Rescuing accidental commits on main using branch and reset."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario22(BaseScenario):
    id = "22"
    title = '移走誤提交：分支與 Reset'
    difficulty = "初階 ⭐⭐"
    story = (
        "菜鳥最大禁忌：你埋頭苦幹了兩個小時，猛然抬頭看終端機——天啊！當前分支居然是 main！\n"
        "強哥正拿著咖啡從走廊走過來，請用「開新分支貼標籤 + 把 main reset 退回」的移花接木大法，\n"
        "在神不知鬼不覺間拯救主線！"
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

        engine.run_git("config", "lab.scenario22.saved", engine.get_head_hash())
        _, base, _ = engine.run_git("rev-parse", "HEAD~2")
        engine.run_git("config", "lab.scenario22.base", base.strip())

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

        _, saved, _ = engine.run_git("config", "--get", "lab.scenario22.saved", check=False)
        _, base, _ = engine.run_git("config", "--get", "lab.scenario22.base", check=False)
        _, feature, _ = engine.run_git("rev-parse", "feature/oauth", check=False)
        _, main, _ = engine.run_git("rev-parse", "main", check=False)
        if main.strip() != base.strip() or feature.strip() != saved.strip():
            return False, "請保留原本 OAuth 的完整提交與主線 base，不能只用同名訊息替代。"
        return True, "🎉 神級平移！你完全掌握了 Git 分支指針貼紙的本質，一秒化解了誤在主線開發的大災難，程式碼零丟失、主線零污染！"
