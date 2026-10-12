"""Scenario 35: Sparse Checkout for Large Repositories."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario35(BaseScenario):
    id = "35"
    title = "超大型 Monorepo 救星：Sparse Checkout 局部檢出"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "公司大型 Monorepo 體積龐大，內含數十個模組。\n"
        "你只需要開發 packages/web，請使用 git sparse-checkout 局部檢出指定目錄！"
    )
    goals = [
        "初始化局部檢出：git sparse-checkout init --cone",
        "設定指定檢出目錄：git sparse-checkout set packages/web",
        "確認工作區只檢出指定目錄"
    ]
    next_steps = [
        "初始化局部檢出：git sparse-checkout init --cone",
        "設定目標資料夾：git sparse-checkout set packages/web",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "執行 git sparse-checkout init --cone 啟用局部檢出模式。",
        "執行 git sparse-checkout set packages/web 指定目標路徑。",
        "輸入 ./git-lab verify 驗收成果！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Create multi-package tree
        engine.create_file("packages/web/index.js", "console.log('web');\n")
        engine.create_file("packages/backend/server.js", "console.log('server');\n")
        engine.create_file("packages/docs/readme.md", "# Docs\n")
        engine.run_git("add", ".")
        engine.run_git("commit", "-m", "feat: monorepo packages")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        code, out, _ = engine.run_git("sparse-checkout", "list", check=False)
        if code != 0:
            return False, "尚未啟用 sparse-checkout！請執行 git sparse-checkout init --cone。"

        patterns = [p.strip() for p in out.splitlines() if p.strip()]
        if not any("packages/web" in p for p in patterns):
            return False, "sparse-checkout 尚未設定 packages/web！請執行 git sparse-checkout set packages/web。"

        return True, "太棒了！你學會了以 Sparse Checkout 高效縮減工作區，Monorepo 開發必備神器！"
