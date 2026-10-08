"""Scenario 18: Amending the last commit with git commit --amend."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario18(BaseScenario):
    id = "18"
    title = "完美補完：git commit --amend 追補漏檔與修改最後提交"
    difficulty = "初階 ⭐⭐"
    story = (
        "高見龍老師《為你自己學 Git》經典狀況題：剛敲下 git commit，才驚覺有檔案漏掉了！\n"
        "你剛為專案提交了版本，但手快漏掉了關鍵的品牌圖檔 `assets/logo.png`，\n"
        "而且 Commit 訊息還不小心手滑打成了 `feat: relase v1.0.0`（release 拼錯字）。\n"
        "如果這時候再開一個 commit 寫『fix typo』或『add missing logo』，不僅歷史零碎，Code Review 時也顯得不夠專業。\n"
        "這時候就是 `git commit --amend` 大顯身手的最佳時刻——直接將暫存區的檔案融合進最後一次 Commit，並修正訊息！"
    )
    goals = [
        "將遺漏的檔案 assets/logo.png 加入暫存區 (git add assets/logo.png)",
        "使用 git commit --amend 修正最後一次提交",
        "將 Commit 訊息修正為包含 'feat: release v1.0.0'",
        "確認專案維持單一乾淨 Commit 節點，未產生多餘修補提交"
    ]
    next_steps = [
        "檢查未追蹤的遺漏檔案：git status",
        "暫存遺漏檔案：git add assets/logo.png",
        "追加並修改提交訊息：git commit --amend -m 'feat: release v1.0.0'",
        "檢查歷史紀錄確認只有一個 Commit：git log --oneline",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "若只需追加檔案而不改訊息，可使用：git commit --amend --no-edit",
        "若只要改訊息而不增減檔案，直接執行：git commit --amend -m '新訊息'",
        "注意：--amend 會產生新的 Commit Hash，因此如果該 Commit 已經 push 到遠端且他人已拉取，請勿隨意 amend！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 建立主要程式碼
        app_file = engine.workspace / "app.py"
        app_file.write_text("print('Welcome to Production App v1.0.0')\n", encoding="utf-8")
        engine.run_git("add", "app.py")
        engine.run_git("commit", "-m", "feat: relase v1.0.0")

        # 2. 建立遺漏的檔案，留在工作區作為未追蹤檔案
        assets_dir = engine.workspace / "assets"
        assets_dir.mkdir(exist_ok=True)
        logo_file = assets_dir / "logo.png"
        logo_file.write_text("[PNG_BINARY_DATA: BRAND_LOGO_ICON]", encoding="utf-8")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查工作區是否乾淨
        _, status_out, _ = engine.run_git("status", "--porcelain")
        dirty = [l for l in status_out.splitlines() if "git-lab" not in l]
        if dirty:
            return False, "工作區還有未暫存或未提交的變更！請先將 assets/logo.png 併入 Commit。"

        # 2. 檢查 Commit 數量，必須剛好只有 1 個
        _, log_out, _ = engine.run_git("rev-list", "--count", "HEAD")
        count = int(log_out.strip() or "0")
        if count > 1:
            return False, f"檢測到歷史中有 {count} 個 Commit！你可能多開了一個新提交，請使用 git commit --amend 融合進最後一次提交。"

        # 3. 檢查最後一個 Commit 是否包含 assets/logo.png
        _, tree_out, _ = engine.run_git("ls-tree", "-r", "--name-only", "HEAD")
        files = tree_out.strip().split()
        if "assets/logo.png" not in files:
            return False, "最後一次 Commit 之中尚未包含 assets/logo.png！請執行 git add assets/logo.png 後再使用 git commit --amend。"

        # 4. 檢查 Commit 訊息是否已修正拼寫
        _, msg_out, _ = engine.run_git("log", "-1", "--pretty=%B")
        msg = msg_out.strip()
        if "release" not in msg.lower() or "relase" in msg.lower():
            return False, f"Commit 訊息尚未修正拼字！當前訊息為: '{msg}'，應修正為正確的 'release'。"

        return True, "🎉 完美收官！你成功使用 git commit --amend 追補了遺漏檔案並修正了拼寫錯誤，保持了神級乾淨的單一提交歷史！"
