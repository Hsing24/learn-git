"""Scenario 32: Stacked PRs with git rebase --onto."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario32(BaseScenario):
    id = "32"
    title = '堆疊分支：Rebase Onto 搬移範圍'
    difficulty = "進階 ⭐⭐⭐⭐⭐"
    story = (
        "你在 feature/api 上開出 feature/ui 疊疊樂開發。\n"
        "沒想到主管直接將 api 分支 squash merge 進 main，導致 ui 分支一 rebase 就滿地衝突！\n"
        "這時唯有手術刀級的 git rebase --onto 能幫你完美截枝，乾淨嫁接回主線！"
    )
    goals = [
        "使用 git rebase --onto main feature/api feature/ui 搬移分支",
        "確認 feature/ui 直接接在 main 最新節點之後",
        "確認 feature/ui 僅包含自己的 2 個 commits"
    ]
    next_steps = [
        "執行變基截枝：git rebase --onto main feature/api feature/ui",
        "檢視歷史：git log --oneline -5",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "輸入 git rebase --onto main feature/api feature/ui。",
        "這會將 feature/api..feature/ui 範圍的提交拔起，直接嫁接在 main 之上。",
        "完成後執行 ./git-lab verify。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('base')\n", "feat: base app")

        # feature/api branch: 2 commits
        engine.run_git("checkout", "-b", "feature/api")
        engine.commit_file("api.py", "def api_1(): pass\n", "feat(api): endpoint 1")
        engine.commit_file("api.py", "def api_1(): pass\ndef api_2(): pass\n", "feat(api): endpoint 2")

        # feature/ui branch: 2 commits on top of feature/api
        engine.run_git("checkout", "-b", "feature/ui")
        engine.commit_file("ui.py", "button = True\n", "feat(ui): buttons")
        engine.commit_file("ui.py", "button = True\nform = True\n", "feat(ui): forms")

        # main squash-merged feature/api
        engine.run_git("checkout", "main")
        engine.commit_file("api.py", "def api_1(): pass\ndef api_2(): pass\n", "feat: complete api (squash merged)")

        # Leave user on feature/ui
        engine.run_git("checkout", "feature/ui")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check feature/ui has main as ancestor
        code, is_anc, _ = engine.run_git("merge-base", "--is-ancestor", "main", "feature/ui", check=False)
        if code != 0:
            return False, "feature/ui 尚未嫁接至 main 分支之上！請執行 git rebase --onto main feature/api feature/ui。"

        # Count commits between main and feature/ui
        code, log_out, _ = engine.run_git("log", "main..feature/ui", "--oneline", check=False)
        lines = [l for l in log_out.splitlines() if l.strip()]
        if len(lines) != 2:
            return False, f"feature/ui 上應該只保留 2 個 ui 提交，目前有 {len(lines)} 個（可能包含了重複的 api 提交）。"

        from lab.scenarios.expanded import ended
        _, base, _ = engine.run_git("rev-parse", "feature/ui~2", check=False)
        _, main, _ = engine.run_git("rev-parse", "main", check=False)
        _, ui, _ = engine.run_git("show", "feature/ui:ui.py", check=False)
        _, api, _ = engine.run_git("show", "feature/ui:api.py", check=False)
        if not ended(engine) or base != main or ui != "button = True\nform = True\n" or api != "def api_1(): pass\ndef api_2(): pass\n":
            return False, "請完成 onto 的兩筆 UI 線性提交並保留 API 與 UI 內容。"
        return True, "太不可思議了！你掌握了高階 --onto 截枝神技，輕鬆化解了 Stacked PR 歷史重疊難題！"
