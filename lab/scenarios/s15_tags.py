"""Scenario 15: Release milestones with Git Tags and Semantic Versioning."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario15(BaseScenario):
    id = "15"
    title = "版本里程碑：Git Tag 與語意化版號發布 (Semantic Versioning)"
    difficulty = "初階 ⭐⭐"
    story = (
        "在軟體專案中，當程式碼開發到特定里程碑（如正式上線發布 Release）時，我們需要給特定 Commit 打上『版本標籤 (Git Tag)』，例如 `v1.0.0`。\n"
        "Git 標籤分為兩種：\n"
        "1. **輕量標籤 (Lightweight Tag)**：僅僅是一個指向 Commit 的不可變指標（類似不能移動的分支）。\n"
        "2. **附註標籤 (Annotated Tag, `git tag -a`)**：Git 物件庫中的獨立物件，包含打標籤者、日期、簽署資訊與詳細的 Release Notes，是業界正式發布的標準做法！\n"
        "此外，學會給歷史 Commit 補簽標籤、查詢標籤詳情、以及安全刪除打錯的標籤，是每個開發者的基本素養。"
    )
    goals = [
        "在當前 HEAD 打上名為 v1.0.0 的附註標籤：git tag -a v1.0.0 -m 'Release v1.0.0'",
        "查詢歷史提交，找到『feat: user authentication system』對應的 Commit Hash",
        "給該歷史 Commit 補簽名為 v0.9.0 的附註標籤：git tag -a v0.9.0 <hash> -m 'Beta v0.9.0'",
        "使用 git tag -n 查看所有標籤與其附帶的說明文字",
        "理解遠端推送 (git push origin --tags) 與遠端刪除標籤的規範"
    ]
    next_steps = [
        "為當前進度打正式發布標籤：git tag -a v1.0.0 -m 'Release v1.0.0'",
        "查詢歷史提交：git log --oneline",
        "找到 user authentication 的 hash 並補打標籤：git tag -a v0.9.0 <hash> -m 'Beta v0.9.0'",
        "檢視標籤列表：git tag -n",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "附註標籤必須加上 -a 參數，例如 git tag -a v1.0.0 -m '說明訊息'。",
        "補打歷史標籤時，只要在最後面指定目標 commit 的 hash 即可，例如 git tag -a v0.9.0 <hash> -m '訊息'。",
        "可以使用 git cat-file -t v1.0.0 確認其為正式的 tag 物件（若顯示 commit 則代表誤打成輕量標籤）。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 建立一系列具備版本演進的 Commits
        app_file = engine.workspace / "app.py"
        app_file.write_text("print('App initial scaffold')\n", encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: initial project scaffold")

        auth_file = engine.workspace / "auth.py"
        auth_file.write_text("def login(): return True\n", encoding="utf-8")
        engine.run_git("add", "auth.py")
        engine.run_git("commit", "-m", "feat: user authentication system")

        auth_file.write_text("def login(user, pwd): return bool(user and pwd)\n", encoding="utf-8")
        engine.run_git("add", "auth.py")
        engine.run_git("commit", "-m", "fix: handle edge case in login validation")

        changelog = engine.workspace / "CHANGELOG.md"
        changelog.write_text("# Changelog\n\n## v1.0.0\n- First production release!\n", encoding="utf-8")
        engine.run_git("add", "CHANGELOG.md")
        engine.run_git("commit", "-m", "docs: update changelog for release")

        # 2. 建立指南文件
        guide_path = engine.workspace / "TAG_GUIDE.md"
        guide_path.write_text(
            "# 🎯 Level 15：Git Tag 語意化版本管理指南\n\n"
            "## 輕量標籤 vs 附註標籤：\n"
            "- 輕量標籤 (`git tag v1.0`)：只是個指標，沒有發布訊息與簽名。\n"
            "- 附註標籤 (`git tag -a v1.0.0 -m '...'`)：完整 Git 物件，推薦正式發布使用！\n\n"
            "## 操作任務：\n"
            "1. 替當前最新進度打上 `v1.0.0`：\n"
            "   ```bash\n"
            "   git tag -a v1.0.0 -m 'Release v1.0.0'\n"
            "   ```\n"
            "2. 找到歷史中 `feat: user authentication system` 的 Commit Hash：\n"
            "   ```bash\n"
            "   git log --oneline\n"
            "   ```\n"
            "3. 給該歷史 Commit 補簽 `v0.9.0`：\n"
            "   ```bash\n"
            "   git tag -a v0.9.0 <目標CommitHash> -m 'Beta v0.9.0'\n"
            "   ```\n"
            "4. 驗收成果：\n"
            "   ```bash\n"
            "./git-lab verify\n"
            "   ```\n",
            encoding="utf-8"
        )

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查 v1.0.0 標籤
        code_v1, _, _ = engine.run_git("rev-parse", "v1.0.0", check=False)
        if code_v1 != 0:
            return False, "找不到標籤 `v1.0.0`！請使用 `git tag -a v1.0.0 -m 'Release v1.0.0'`。"

        # 檢查是否為附註標籤
        _, type_out, _ = engine.run_git("cat-file", "-t", "v1.0.0", check=False)
        if type_out.strip() != "tag":
            return False, (
                "標籤 `v1.0.0` 目前是輕量標籤 (Lightweight)！\n"
                "正式發布強烈建議建立附註標籤：請使用 `git tag -d v1.0.0` 刪除後，"
                "重新以 `git tag -a v1.0.0 -m 'Release v1.0.0'` 建立。"
            )

        # 2. 檢查 v0.9.0 標籤
        code_v09, _, _ = engine.run_git("rev-parse", "v0.9.0", check=False)
        if code_v09 != 0:
            return False, "找不到標籤 `v0.9.0`！請使用 `git log --oneline` 找到 user authentication 提交並補簽標籤。"

        # 檢查 v0.9.0 是否指向正確的 commit
        _, out_msg, _ = engine.run_git("log", "-1", "--pretty=%s", "v0.9.0^{commit}", check=False)
        commit_msg = out_msg.strip()
        if "user authentication" not in commit_msg:
            return False, (
                f"標籤 `v0.9.0` 指向了錯誤的 Commit (當前指向: '{commit_msg}')！\n"
                "它應該補簽在包含 'user authentication' 的歷史提交上。"
            )

        return True, (
            "🎉 恭喜通關！你成功掌握了 Git Tag 附註標籤與歷史補簽技術！\n"
            "💡 **進階實用技**：\n"
            "- 推送標籤到遠端：`git push origin --tags`（或 `git push origin v1.0.0`）\n"
            "- 刪除打錯的遠端標籤：`git push origin --delete v1.0.0`\n"
            "- 標籤常作為 GitHub Releases、Docker Image 版號與 CI/CD 自動部屬的觸發條件！"
        )
