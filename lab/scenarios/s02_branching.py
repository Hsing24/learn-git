"""Scenario 02: Branching and Fast-Forward Merge."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario02(BaseScenario):
    id = "02"
    title = "分支流動：建立、切換與 Fast-Forward 合併"
    difficulty = "初階 ⭐⭐"
    story = (
        "主線 (main) 上已有便當系統的基礎程式。現在產品經理希望新增「會員折扣」模組。\n"
        "團隊規範嚴格禁止直接在 main 開發！你必須開闢一條獨立分支 feature-discount，\n"
        "完成功能開發與提交後，切換回 main 分支並將其合併進主線。"
    )
    goals = [
        "建立並切換至新分支 feature-discount",
        "建立新檔案 discount.py 並撰寫折扣程式碼",
        "在 feature-discount 分支上完成 commit（訊息例如：feat: add discount）",
        "切換回 main 分支",
        "使用 git merge feature-discount 將其合併回 main 分支"
    ]
    next_steps = [
        "建立並切分支：git checkout -b feature-discount (或 git switch -c feature-discount)",
        "建立檔案 discount.py，並加入暫存：git add discount.py",
        "提交版本：git commit -m \"feat: add discount calculator\"",
        "切回主線：git checkout main (或 git switch main)",
        "合併分支：git merge feature-discount",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "切換並建立分支指令：git checkout -b feature-discount",
        "建立檔案可以用 echo 或編輯器，例如：echo 'def get_discount(): return 0.9' > discount.py",
        "提交後記得切回 main：git checkout main，再執行 git merge feature-discount"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)
        engine.run_git("branch", "-D", "feature-discount", check=False)
        
        # Commit base code
        engine.commit_file("menu.txt", "1. 排骨便當 $100\n2. 雞腿便當 $110\n", "feat: initial menu")
        engine.commit_file("app.py", "print('便當系統運行中')\n", "feat: basic app runner")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        branch = engine.get_current_branch()
        if branch != "main":
            return False, f"目前所在分支為 '{branch}'，請切換回 'main' 分支 (git checkout main) 再進行驗證。"

        if not engine.file_exists("discount.py"):
            return False, "在 main 分支上找不到 discount.py 檔案，請確認是否已正確將 feature-discount 合併回 main。"

        # Check if discount.py is tracked in main HEAD
        code, out, _ = engine.run_git("ls-tree", "-r", "--name-only", "HEAD", check=False)
        if "discount.py" not in [l.strip() for l in out.splitlines()]:
            return False, "discount.py 尚未被 commit 或合併進 main 分支。"

        return True, "太棒了！你順利完成了建立分支、切換分支、獨立開發到合併 (Fast-Forward) 的完整工作流！"
