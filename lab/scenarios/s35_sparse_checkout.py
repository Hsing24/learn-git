"""Scenario 35: Sparse Checkout for Large Repositories."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario35(BaseScenario):
    id = "35"
    title = '大型專案：Sparse Checkout 工作區範圍'
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "公司的老古董 Monorepo 歷史龐大動輒幾十 GB，你的小筆電硬碟快被塞爆了。\n"
        "在只要開發前端模組的情況下，請開啟 sparse-checkout 稀疏檢出，只在工作目錄檢出需要的目錄；物件下載量另由 partial clone 控制！"
    )
    goals = [
        "Sparse checkout 限制工作目錄呈現，並不限制下載物件；partial clone 另於選修 46",
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
        if patterns != ["packages/web"]:
            return False, "sparse-checkout 必須只設定 packages/web，請移除其他檢出目錄。"

        code, sparse_enabled, _ = engine.run_git("config", "--bool", "core.sparseCheckout", check=False)
        if code != 0 or sparse_enabled.strip() != "true":
            return False, "尚未啟用 sparse-checkout！請執行 git sparse-checkout init --cone。"

        code, cone_enabled, _ = engine.run_git("config", "--bool", "core.sparseCheckoutCone", check=False)
        if code != 0 or cone_enabled.strip() != "true":
            return False, "請以 cone 模式啟用 sparse-checkout：git sparse-checkout init --cone。"

        if not engine.file_exists("packages/web/index.js"):
            return False, "packages/web 尚未檢出，請執行 git sparse-checkout set packages/web。"
        if engine.file_exists("packages/backend/server.js") or engine.file_exists("packages/docs/readme.md"):
            return False, "工作區仍包含 packages/web 以外的模組，請只設定 packages/web。"

        return True, "太棒了！你學會了以 Sparse Checkout 高效縮減工作區，Monorepo 開發必備神器！"
