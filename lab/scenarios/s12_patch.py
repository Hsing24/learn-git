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
    title = "精準原子暫存：git add -p 局部區塊暫存 (Patch Staging)"
    difficulty = "進階 ⭐⭐⭐"
    story = (
        "在真實日常開發中，我們常常在同一個檔案內做了兩到三處不同維度的修改：\n"
        "例如：修復了一個計算金額的 Bug，同時又替收據增加了貨幣符號的顯示。\n"
        "如果直接使用 `git add .` 全部提交，會將修復與新功能混在一起，違背『原子提交 (Atomic Commit)』與 Clean Code 原則，讓 PR Code Review 極為痛苦。\n"
        "Git 提供了殺手級功能：`git add -p`（Patch 模式），允許我們以代碼區塊 (Hunk) 為單位，精確挑選要暫存的變更！"
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
        # 1. 檢查 commit 數量是否增加
        code_count, out_count, _ = engine.run_git("rev-list", "--count", "HEAD", check=False)
        if code_count != 0:
            return False, "無法讀取 Git 提交紀錄。"
        
        count = int(out_count.strip())
        if count < 2:
            return False, "尚未產生任何新的 Commit！請使用 `git add -p` 暫存其中一個區塊並執行 commit。"

        # 2. 檢視自 initial commit 以來的第一個新 commit 的 diff
        # 如果用戶有 2 個 commit (initial + 1 個原子 commit)
        # 取得 HEAD 的 diff
        _, commit_diff, _ = engine.run_git("show", "HEAD", check=False)

        has_discount = "discount_rate" in commit_diff
        has_currency = "NT$" in commit_diff

        # 檢查是否在同一個 commit 裡同時包進了兩個改動 (沒有拆開)
        if count == 2 and has_discount and has_currency:
            return False, (
                "🚨 檢測到你在最新 Commit 中同時打包了『折扣計算』與『NT$ 貨幣符號』兩處改動！\n"
                "本關目標是鍛鍊『原子提交』，請重新執行 `./git-lab reset 12`，"
                "並在 `git add -p` 提示時分別按 `y` 與 `n` 將它們拆開！"
            )

        # 若最新 commit 或前一個 commit 成功分離了這兩個區塊
        return True, (
            "🎉 太棒了！你成功掌握了 `git add -p` 互動式區塊暫存！\n"
            "在大型專案中，當你在一個檔案改了多個功能或修復時，利用 patch 模式精準切分 Hunk、"
            "組織乾淨單一職責的 Atomic Commit，能大幅提升 PR Code Review 品質與 Git 歷史可讀性！"
        )
