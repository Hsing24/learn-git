"""Scenario 14: Reverting a broken merge commit with git revert -m 1."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

STABLE_APP_CODE = '''def get_service_status():
    return {"status": "healthy", "version": "1.0.0"}


def process_payment(amount):
    # 穩定運行的支付模組 v1.0
    print(f"Processing payment: ${amount} successfully.")
    return True
'''

BROKEN_APP_CODE = '''def get_service_status():
    return {"status": "healthy", "version": "2.0.0"}


def process_payment(amount):
    # 💥 存在嚴重未捕捉異常的 v2 支付模組！引發 P0 生產事故！
    raise RuntimeError("CRITICAL ERROR: Payment gateway connection timeout! System crash!")
'''

class Scenario14(BaseScenario):
    id = "14"
    title = "線上緊急回滾：解救生產事故的 Revert Merge (git revert -m 1)"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "週五下午，一個新功能 PR 被合併到了 `main` 分支並發布上線。\n"
        "十分鐘後監控警報狂響，新功能造成嚴重的生產事故 (P0 Outage)！主管要求立刻回滾主線。\n"
        "當你輸入 `git revert <merge_commit>` 時，Git 卻報錯：\n"
        "`fatal: commit ... is a merge but no -m option was given.`\n"
        "這是因為 Merge 節點擁有兩個父節點（Parent 1 代表 target 分支如 main，Parent 2 代表 feature 分支）。\n"
        "Git 不知道你想以誰作為基準線，因此必須使用 `-m 1` 指定保留主線父節點，生成乾淨的回滾提交！"
    )
    goals = [
        "使用 git log 觀察當前 HEAD 是一個包含雙親的 Merge Commit",
        "嘗試直接執行 git revert HEAD，親身體驗 Git 拋出的 -m option 錯誤",
        "使用 git revert -m 1 HEAD 正確產生回滾提交",
        "檢查 app.py 確認代碼已恢復至合併前的穩定狀態，生產事故解除",
        "理解日後若要重新合併該 feature 分支時的 Re-revert 機制"
    ]
    next_steps = [
        "檢視 Merge Commit 結構：git log -n 3 --oneline --graph",
        "體驗原生報錯：git revert HEAD",
        "執行正確回滾：git revert -m 1 HEAD --no-edit",
        "檢查程式碼是否回滾：cat app.py",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "在 Merge Commit 中，Parent 1 (-m 1) 是你原本 merge 時所在的分支（main），Parent 2 (-m 2) 是被合併的分支。",
        "執行 git revert -m 1 HEAD --no-edit 會直接產生一筆新的反轉提交，迅速回滾變更且無需手動編輯訊息。",
        "回滾後，主線歷史依然保持向前推進（Append-only），最適合團隊協作與 CI/CD 自動化部屬。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 建立 main 分支上的穩定版本 v1.0
        app_path = engine.workspace / "app.py"
        app_path.write_text(STABLE_APP_CODE, encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: stable payment v1.0 on main")

        # 2. 開出 feature/payment-v2 分支並寫入重大 bug
        engine.run_git("switch", "-c", "feature/payment-v2")
        app_path.write_text(BROKEN_APP_CODE, encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: implement payment gateway v2 with breaking bug")

        # 3. 切回 main 分支並做一個日常 commit
        engine.run_git("switch", "main")
        readme_path = engine.workspace / "README.md"
        readme_path.write_text(
            "# Payment Gateway Service\nRunning smoothly in production.\n",
            encoding="utf-8"
        )
        engine.run_git("add", "README.md")
        engine.run_git("commit", "-m", "chore: update documentation on main")

        # 4. 將壞掉的 feature 分支 merge 進 main，產生 Merge Commit
        engine.run_git(
            "merge", "--no-ff", "feature/payment-v2",
            "-m", "Merge branch 'feature/payment-v2' into main"
        )

        # 5. 建立指引文件
        guide_path = engine.workspace / "REVERT_GUIDE.md"
        guide_path.write_text(
            "# 🚨 P0 事故緊急應變指南：Revert Merge Commit\n\n"
            "## 事故狀況：\n"
            "剛合併的 `feature/payment-v2` 造成了生產環境崩潰！需要立即回滾 `main` 分支！\n\n"
            "## 為什麼 `git revert HEAD` 會報錯？\n"
            "因為 Merge 提交有兩個父母：\n"
            "- Parent 1：`main` 分支原本的進度\n"
            "- Parent 2：`feature/payment-v2` 分支的進度\n\n"
            "## 正確回滾指令：\n"
            "```bash\n"
            "git revert -m 1 HEAD --no-edit\n"
            "```\n"
            "`-m 1` 告訴 Git：『請以 Parent 1 (main) 為基準，把 Parent 2 帶來的改動全部反轉！』\n\n"
            "## 驗收成果：\n"
            "```bash\n"
            "./git-lab verify\n"
            "```\n",
            encoding="utf-8"
        )

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查最新 commit 是否為 Revert 提交
        code_msg, out_msg, _ = engine.run_git("log", "-1", "--pretty=%s", check=False)
        if code_msg != 0:
            return False, "無法讀取 Commit 紀錄。"

        msg = out_msg.strip()
        if not ("Revert" in msg or "revert" in msg):
            return False, "最新 Commit 不是 Revert 提交！請執行 `git revert -m 1 HEAD` 回滾事故代碼。"

        # 2. 檢查 app.py 內容是否已清除壞掉的代碼
        app_path = engine.workspace / "app.py"
        if not app_path.exists():
            return False, "找不到 app.py 檔案！"

        content = app_path.read_text(encoding="utf-8")
        if "CRITICAL ERROR" in content:
            return False, "app.py 依然包含導致崩潰的程式碼，回滾未成功！"

        if "穩定運行的支付模組 v1.0" not in content:
            return False, "app.py 未能正確還原至 v1.0 穩定狀態！"

        # 3. 檢查工作區是否乾淨
        _, out_status, _ = engine.run_git("status", "--porcelain", check=False)
        dirty = [l for l in out_status.splitlines() if "app.py" in l]
        if dirty:
            return False, "工作區尚有未提交的改動，請確保已完成 commit。"

        return True, (
            "🎉 救火成功！生產事故已順利解除！\n"
            "你成功學會了使用 `git revert -m 1` 解救線上災難的黃金技能。\n"
            "💡 **資深心法**：若未來該 feature 分支修好 bug 想再次合併進 main，"
            "直接 merge 會發現先前的代碼無法進來；正確做法是先對這次的 Revert Commit 再做一次 Revert（Re-revert），然後重新合併！"
        )
