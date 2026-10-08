"""Scenario 19: Working directory shelving with git stash."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario19(BaseScenario):
    id = "19"
    title = "救急暫存：Git Stash 工作區暫存、彈出與清理"
    difficulty = "初階 ⭐⭐"
    story = (
        "高見龍老師《為你自己學 Git》高頻狀況題：手邊做到一半，臨時要切換任務！\n"
        "你正在 `feature/cart` 分支開發購物車結帳邏輯，修改了 `cart.py` 且新增了未追蹤的折價券檔案 `coupon.py`。\n"
        "這時候線上突然發生緊急狀況，主管要求你立即切換到 `main` 分支查看生產環境程式碼！\n"
        "如果這時候直接切換分支，Git 會嚴格報錯並拒絕切換，因為工作目錄存在未提交的修改。\n"
        "此時千萬不要為了切分支而隨便下一個殘缺不全的『wip』commit！\n"
        "請使用 `git stash -u` 將工作進度打包放入暫存棧，切至 main 查看後，再切回分支透過 `git stash pop` 完美復原！"
    )
    goals = [
        "使用 git stash -u（含未追蹤檔案）清空當前工作目錄變更",
        "切換至 main 分支並提交緊急修復：git switch main ➜ 建立 hotfix.txt 並 commit",
        "切回 feature/cart 分支 (git switch feature/cart)",
        "使用 git stash pop 將暫存區代碼安全彈出並還原至工作目錄",
        "確認 cart.py 與 coupon.py 完整復原，且 stash 棧已被清空"
    ]
    next_steps = [
        "查看當前修改與未追蹤檔案：git status",
        "打包工作區變更（包含未追蹤檔案）：git stash -u",
        "確認工作區已乾淨：git status",
        "切換至 main 分支：git switch main",
        "在 main 分支提交修復：echo 'HOTFIX_v1.0.1' > hotfix.txt && git add hotfix.txt && git commit -m 'fix: emergency hotfix on main'",
        "切回 feature 分支：git switch feature/cart",
        "彈出並還原暫存代碼：git stash pop",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "預設的 git stash 只會存檔已被追蹤的修改；若有新建立的檔案，務必加上 -u (即 --include-untracked)！",
        "git stash pop 會還原暫存並自動自 stash 清單移除；若使用 git stash apply 則會保留在清單中。",
        "可隨時使用 git stash list 查看目前儲存的暫存項目。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 基礎主線提交
        base_file = engine.workspace / "app.py"
        base_file.write_text("print('Production Stable Server')\n", encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: initial stable release")

        # 2. 開設 feature/cart 分支
        engine.run_git("checkout", "-b", "feature/cart")

        cart_file = engine.workspace / "cart.py"
        cart_file.write_text("def checkout():\n    return 'checkout completed'\n", encoding="utf-8")
        engine.run_git("add", "cart.py")
        engine.run_git("commit", "-m", "feat: scaffold cart logic")

        # 3. 正在進行中但未完成的修改 (modified)
        cart_file.write_text(
            "def checkout():\n"
            "    # TODO: calculate discounts\n"
            "    return 'checkout completed with discount'\n",
            encoding="utf-8"
        )

        # 4. 新增的未追蹤檔案 (untracked)
        coupon_file = engine.workspace / "coupon.py"
        coupon_file.write_text("COUPON_CODE = 'SUMMER_SALE_50_OFF'\n", encoding="utf-8")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查 main 分支是否包含 hotfix 提交
        _, main_log, _ = engine.run_git("log", "main", "--oneline")
        if "hotfix" not in main_log.lower():
            return False, "尚未在 main 分支完成緊急 hotfix 提交！請先 stash 暫存後，切換至 main 提交修復。"

        # 2. 檢查當前分支是否已切回 feature/cart
        _, branch_out, _ = engine.run_git("rev-parse", "--abbrev-ref", "HEAD")
        current_branch = branch_out.strip()
        if current_branch != "feature/cart":
            return False, f"目前所在分支為 '{current_branch}'，請切回 feature/cart 分支後再執行 git stash pop！"

        # 2. 檢查 cart.py 是否已還原包含折扣邏輯
        cart_file = engine.workspace / "cart.py"
        if not cart_file.exists():
            return False, "cart.py 不存在，請確認是否已執行 git stash pop 還原！"
        cart_content = cart_file.read_text(encoding="utf-8")
        if "SUMMER_SALE" in cart_content or "with discount" not in cart_content:
            return False, "cart.py 內容尚未正確還原暫存中的修改！"

        # 3. 檢查 coupon.py 是否已還原
        coupon_file = engine.workspace / "coupon.py"
        if not coupon_file.exists():
            return False, "未追蹤的 coupon.py 遺失！請確認當初暫存時是否使用了 git stash -u（包含未追蹤檔案）並執行了 pop。"
        coupon_content = coupon_file.read_text(encoding="utf-8")
        if "SUMMER_SALE_50_OFF" not in coupon_content:
            return False, "coupon.py 內容不完整！"

        # 4. 檢查 stash 清單是否已清除
        _, stash_out, _ = engine.run_git("stash", "list")
        if stash_out.strip():
            return False, "檢測到 stash 佇列中仍殘留項目！請確認是使用 'git stash pop'（彈出並刪除）而非 'git stash apply'。"

        return True, "🎉 漂亮通關！你熟練運用了 git stash -u 與 git stash pop，在零殘留與零髒 commit 的情況下化解了上下文切換的危機！"
