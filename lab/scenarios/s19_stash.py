"""Scenario 19: Working directory shelving with git stash."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario19(BaseScenario):
    id = "19"
    title = '切換任務：Stash 保留與衝突'
    difficulty = "初階 ⭐⭐"
    story = (
        "你正改得一頭熱，程式碼半生不熟連編譯都過不了，主管突然拍桌：「快！線上客戶登不進去，先切回 main 查看生產環境！」\n"
        "眼前這堆半成品尚未準備好正式提交，也不能丟掉，請用 git stash 暫存現場，修完再用 git stash apply --index 還原暫存狀態！"
    )
    goals = [
        "使用 git stash -u（含未追蹤檔案）清空當前工作目錄變更",
        "切換至 main 分支並提交緊急修復：git switch main ➜ 建立 hotfix.txt 並 commit",
        "切回 feature/cart 分支 (git switch feature/cart)",
        "使用 git stash apply --index 還原暫存狀態，確認後 git stash drop",
        "在 stash-conflict 沙盒觸發 apply 衝突、手動解決並提交，再 drop 保留中的 stash",
        "確認 cart.py 與 coupon.py 完整復原，且 stash 棧已被清空"
    ]
    next_steps = [
        "查看當前修改與未追蹤檔案：git status",
        "打包工作區變更（包含未追蹤檔案）：git stash -u",
        "確認工作區已乾淨：git status",
        "切換至 main 分支：git switch main",
        "在 main 分支提交修復：echo 'HOTFIX_v1.0.1' > hotfix.txt && git add hotfix.txt && git commit -m 'fix: emergency hotfix on main'",
        "切回 feature 分支：git switch feature/cart",
        "還原原暫存狀態：git stash apply --index，確認 git diff --cached 後 git stash drop",
        "在 stash-conflict：git stash push；修改 state.txt 為 upstream 並 commit；git stash apply 觸發衝突",
        "編輯 state.txt 保留 upstream 與 stashed，git add/commit，再 git stash drop",
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

        engine.run_git("add", "cart.py")
        directory = engine.workspace / "stash-conflict"
        directory.mkdir()
        engine.run_git("init", "-b", "main", cwd=directory)
        (directory / "state.txt").write_text("base\n")
        engine.run_git("add", "state.txt", cwd=directory)
        engine.run_git("commit", "-m", "base", cwd=directory)
        (directory / "state.txt").write_text("stashed\n")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查 main 分支是否包含 hotfix 提交
        code, main_hotfix, _ = engine.run_git("show", "main:hotfix.txt", check=False)
        if code != 0 or not main_hotfix.strip():
            return False, "尚未在 main 分支完成緊急 hotfix 提交！請先 stash 暫存後，切換至 main 提交修復。"

        # 2. 檢查當前分支是否已切回 feature/cart
        _, branch_out, _ = engine.run_git("rev-parse", "--abbrev-ref", "HEAD")
        current_branch = branch_out.strip()
        if current_branch != "feature/cart":
            return False, f"目前所在分支為 '{current_branch}'，請切回 feature/cart 分支後再執行 git stash apply --index！"

        # 2. 檢查 cart.py 是否已還原包含折扣邏輯
        cart_file = engine.workspace / "cart.py"
        if not cart_file.exists():
            return False, "cart.py 不存在，請確認是否已執行 git stash apply --index 還原！"
        cart_content = cart_file.read_text(encoding="utf-8")
        if "SUMMER_SALE" in cart_content or "with discount" not in cart_content:
            return False, "cart.py 內容尚未正確還原暫存中的修改！"

        # 3. 檢查 coupon.py 是否已還原
        coupon_file = engine.workspace / "coupon.py"
        if not coupon_file.exists():
            return False, "未追蹤的 coupon.py 遺失！請確認當初暫存時是否使用了 git stash -u（包含未追蹤檔案）並執行了 apply --index。"
        coupon_content = coupon_file.read_text(encoding="utf-8")
        if "SUMMER_SALE_50_OFF" not in coupon_content:
            return False, "coupon.py 內容不完整！"

        # 4. 檢查 stash 清單是否已清除
        _, stash_out, _ = engine.run_git("stash", "list")
        if stash_out.strip():
            return False, "檢測到 stash 佇列中仍殘留項目！請在 apply 並確認內容後使用 git stash drop。"

        _, staged_cart, _ = engine.run_git("show", ":cart.py", check=False)
        if staged_cart != cart_file.read_text(encoding="utf-8"):
            return False, "cart.py 原本已暫存，請以 apply --index 還原 index。"
        directory = engine.workspace / "stash-conflict"
        if not (directory / ".git").is_dir():
            return False, "請保留 stash-conflict 練習儲存庫。"
        code, resolved, _ = engine.run_git("show", "HEAD:state.txt", cwd=directory, check=False)
        _, stashes, _ = engine.run_git("stash", "list", cwd=directory, check=False)
        _, unresolved, _ = engine.run_git("ls-files", "-u", cwd=directory, check=False)
        if code != 0 or resolved != "upstream\nstashed\n" or stashes.strip() or unresolved.strip():
            return False, "請在 stash-conflict 解決 apply 衝突，提交 upstream/stashed 兩行，確認後 drop stash。"
        return True, "🎉 漂亮通關！你熟練運用了 git stash -u、apply --index、衝突處理與 drop，在零殘留與零髒 commit 的情況下化解了上下文切換的危機！"
