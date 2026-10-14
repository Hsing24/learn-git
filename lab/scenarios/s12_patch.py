"""Scenario 12: Interactive patch staging with git add -p."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

INITIAL_SHOPPING_CODE = '''def calculate_total(items):
    # 計算購物車總金額
    subtotal = sum(item["price"] * item.get("quantity", 1) for item in items)
    # 目前沒有折扣邏輯
    return subtotal


# ---------------------------------------------
# 下方為收據列印模組（相隔足夠行數以形成獨立 Hunk）
# ---------------------------------------------


def print_receipt(customer_name, items, total):
    # 列印客戶收據
    print("=== 收據 ===")
    print(f"客戶: {customer_name}")
    for item in items:
        print(f"- {item['name']}: {item['price']}")
    print(f"總計: {total}")
    print("============")
'''

MODIFIED_SHOPPING_CODE = '''def calculate_total(items, discount_rate=0.1):
    # 計算購物車總金額（套用九折優惠 Bugfix）
    subtotal = sum(item["price"] * item.get("quantity", 1) for item in items)
    discount = subtotal * discount_rate
    return round(subtotal - discount, 2)


# ---------------------------------------------
# 下方為收據列印模組（相隔足夠行數以形成獨立 Hunk）
# ---------------------------------------------


def print_receipt(customer_name, items, total):
    # 列印客戶收據（加上貨幣符號與日期）
    print("=== 收據 ===")
    print(f"客戶: {customer_name}")
    for item in items:
        print(f"- {item['name']}: NT${item['price']}")
    print(f"總計: NT${total}")
    print("============")
'''

class Scenario12(BaseScenario):
    id = "12"
    title = '拆分變更：Patch 局部暫存'
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "你在同一個檔案裡順手改了商業邏輯與排版格式，本想一個 git add . 搞定，\n"
        "強哥路過冷冷地說：「單一職責懂不懂？分開提交。」\n"
        "請用 git add -p 互動式逐塊拆解暫存，達成乾淨專業的原子提交 (Atomic Commit)！"
    )
    goals = [
        "使用 git diff 觀察 shopping.py 中同時存在兩個不同區塊的修改",
        "使用 git add -p shopping.py 進入互動式暫存模式",
        "針對第一個區塊（折扣修復 Bugfix）按 'y' 進行暫存",
        "針對第二個區塊（貨幣符號 Feature）按 'n' 暫時略過",
        "使用 git diff --staged 確認只有 Bugfix 進入暫存區，並執行 commit",
        "體會單一職責與原子提交 (Atomic Commit) 的乾淨歷史魅力"
    ]
    next_steps = [
        "檢查工作區修改：git diff shopping.py",
        "局部暫存：git add -p shopping.py（提示：按 y 暫存當前區塊，按 n 跳過）",
        "檢查暫存區：git diff --staged",
        "提交該原子修復：git commit -m 'fix: apply discount in total calculation'",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "在 git add -p 互動終端中，輸入 y 代表 Stage this hunk，輸入 n 代表 Do not stage this hunk。",
        "如果一個區塊包含太多改動想再細分，可以輸入 s (split)。",
        "完成第一個 commit 後，可以再做一次 git add shopping.py 並建立第二個 commit，或保留第二個區塊未暫存。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 建立初始 shopping.py 並提交
        shopping_path = engine.workspace / "shopping.py"
        shopping_path.write_text(INITIAL_SHOPPING_CODE, encoding="utf-8")
        engine.run_git("add", "shopping.py")
        engine.run_git("commit", "-m", "feat: initial shopping cart and receipt module")

        # 2. 修改檔案中的兩處，使其形成兩個獨立的 Hunks
        shopping_path.write_text(MODIFIED_SHOPPING_CODE, encoding="utf-8")

        # 3. 建立引導指南
        guide_path = engine.workspace / "PATCH_GUIDE.md"
        guide_path.write_text(
            "# 🎯 Level 12：git add -p 局部區塊暫存指南\n\n"
            "## 操作步驟：\n"
            "1. 執行 `git diff`，你會發現 `shopping.py` 同時有兩處修改：\n"
            "   - Hunk 1: `calculate_total` 新增了折扣計算\n"
            "   - Hunk 2: `print_receipt` 加上了 NT$ 貨幣符號\n\n"
            "2. 執行互動式暫存：\n"
            "   ```bash\n"
            "   git add -p shopping.py\n"
            "   ```\n"
            "3. 當詢問 `Stage this hunk [y,n,q,a,d,s,e,?]?` 時：\n"
            "   - 對第一個區塊輸入 `y` (暫存)\n"
            "   - 對第二個區塊輸入 `n` (不暫存)\n\n"
            "4. 執行 `git diff --staged` 驗證只有 Hunk 1 進入暫存區。\n"
            "5. 執行 `git commit -m 'fix: apply discount in total calculation'`。\n"
            "6. 執行 `./git-lab verify` 驗收成果！\n",
            encoding="utf-8"
        )

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        from lab.scenarios.expanded import ended
        count = engine.get_commit_count()
        if count not in (2, 3) or not ended(engine):
            return False, "請完成折扣的獨立提交；收據變更可留工作目錄或另作第二筆提交。"
        _, commits, _ = engine.run_git("rev-list", "--reverse", "HEAD")
        first = commits.splitlines()[1]
        expected = MODIFIED_SHOPPING_CODE.split("def print_receipt", 1)[0] + "def print_receipt" + INITIAL_SHOPPING_CODE.split("def print_receipt", 1)[1]
        code, snapshot, _ = engine.run_git("show", first + ":shopping.py", check=False)
        _, files, _ = engine.run_git("diff-tree", "--no-commit-id", "--name-only", "-r", first, check=False)
        if code != 0 or snapshot != expected or files.strip() != "shopping.py":
            return False, "第一筆新增提交必須只包含完整折扣 hunk，收據仍保留原版；空提交或一次全暫存無法通關。"
        if engine.read_file("shopping.py") != MODIFIED_SHOPPING_CODE:
            return False, "請保留完整折扣與收據變更，不能丟棄未暫存內容。"
        if count == 3:
            code, latest, _ = engine.run_git("show", "HEAD:shopping.py", check=False)
            if code != 0 or latest != MODIFIED_SHOPPING_CODE:
                return False, "第二筆新增提交必須完整保留收據變更。"
        return True, "折扣補丁已獨立提交，收據變更完整保留。"
