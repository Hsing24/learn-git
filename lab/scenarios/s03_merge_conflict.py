"""Scenario 03: Resolving Merge Conflict."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

BASE_ORDER_CODE = '''def calculate_total(items):
    subtotal = sum(item['price'] for item in items)
    # 折扣規則
    discount = 0
    return subtotal - discount
'''

MAIN_ORDER_CODE = '''def calculate_total(items):
    subtotal = sum(item['price'] for item in items)
    # 折扣規則
    discount = 100 if subtotal >= 1000 else 0  # 滿千折百方案
    return subtotal - discount
'''

FEATURE_ORDER_CODE = '''def calculate_total(items):
    subtotal = sum(item['price'] for item in items)
    # 折扣規則
    discount = int(subtotal * 0.2)  # 全館八折方案
    return subtotal - discount
'''

class Scenario03(BaseScenario):
    id = "03"
    title = "迎戰衝突：手動解決 Merge Conflict"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "真實的團隊車禍現場！\n"
        "同事小明在 main 分支修改了 order.py 的折扣邏輯（採用滿千折百）。\n"
        "與此同時，你在 feature-promo 分支上也修改了 order.py 的同一行（採用八折優惠）。\n"
        "當你嘗試將 feature-promo 合併進 main 時，Git 無法自行判斷該聽誰的，爆發了衝突 (CONFLICT)！"
    )
    goals = [
        "使用 git status 檢視處於衝突 (both modified) 的 order.py",
        "打開 order.py，看懂 <<<<<<< HEAD、======= 與 >>>>>>> feature-promo 衝突標記",
        "手動編輯 order.py：刪除所有衝突標記符號，並決定最終保留的折扣程式碼",
        "使用 git add order.py 將解決後的檔案標記為已解決 (Resolved)",
        "使用 git commit 完成這個 Merge Commit"
    ]
    next_steps = [
        "輸入 git status 觀察衝突狀態",
        "編輯 order.py 檔案，清除衝突標記 (<<<<<<<, =======, >>>>>>>) 並儲存",
        "加入暫存：git add order.py",
        "完成提交：git commit -m \"Merge branch 'feature-promo' and resolve conflict\"",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "輸入 git status 可以看到 Unmerged paths: both modified: order.py。",
        "打開 order.py，將所有帶有 <<<<<<< HEAD、=======、>>>>>>> 的行全部刪除，只留下你要的正常程式碼。",
        "存檔後，記得執行 git add order.py 告知 Git「我已經解決了這個衝突」，最後再輸入 git commit 完成合併。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)
        engine.run_git("branch", "-D", "feature-promo", check=False)

        # Base commit on main
        engine.commit_file("order.py", BASE_ORDER_CODE, "feat: base order calculation")

        # Create feature branch and commit
        engine.run_git("checkout", "-b", "feature-promo")
        engine.commit_file("order.py", FEATURE_ORDER_CODE, "feat: implement 20% off promo")

        # Switch back to main and commit different logic
        engine.run_git("checkout", "main")
        engine.commit_file("order.py", MAIN_ORDER_CODE, "feat: implement $100 off over $1000")

        # Trigger merge conflict intentionally
        engine.run_git("merge", "feature-promo", check=False)

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if merge is still in progress
        merge_head = engine.repo_dir / ".git" / "MERGE_HEAD"
        if merge_head.exists():
            return False, "目前仍在 Merge 衝突狀態中！請在手動編輯並 git add order.py 後，執行 git commit 完成合併。"

        # Check order.py content for conflict markers
        content = engine.read_file("order.py")
        if not content:
            return False, "找不到 order.py 檔案！"
        if "<<<<<<<" in content or ">>>>>>>" in content or "=======" in content:
            return False, "order.py 內依然殘留有 Git 衝突標記符號 (<<<<<<<, =======, >>>>>>>)，請徹底刪除這些標記！"

        # Check if HEAD is a merge commit (has 2 parents)
        code, out, _ = engine.run_git("rev-parse", "HEAD^2", check=False)
        if code != 0:
            return False, "當前的最新 Commit 不是 Merge Commit。請確認是透過完成 git merge 提交，而非 git merge --abort 或 reset。"

        return True, "太厲害了！你成功馴服了初學者最害怕的 Merge Conflict！掌握了解決衝突的標準 SOP！"
