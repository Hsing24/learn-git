"""Scenario 20: Renaming with git mv and cleaning untracked artifacts with git clean."""

from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario20(BaseScenario):
    id = "20"
    title = "乾淨俐落：git mv 檔案更名與 git clean -fd 清理雜物"
    difficulty = "初階 ⭐⭐"
    story = (
        "高見龍老師《為你自己學 Git》實戰狀況題：版本控管下的正確檔案更名與垃圾清除！\n"
        "狀況一：專案進行架構重構，團隊規範將舊檔名 `utils.py` 改為現代慣用的 `helpers.py`。\n"
        "如果你只是在終端機打 `mv utils.py helpers.py`，Git 會把它視為『刪除 utils.py』加上『新增未追蹤 helpers.py』兩件事；\n"
        "使用 `git mv utils.py helpers.py` 則能直接在暫存區建立乾淨明確的 renamed 變更！\n\n"
        "狀況二：本地測試執行後，在工作區遺留了雜亂的未追蹤檔案 `debug.log`、`dump.tmp`，以及測試目錄 `temp_test/`。\n"
        "請使用 `git clean -fd` 一鍵將所有未追蹤的垃圾檔案與子目錄徹底抹除，回歸極簡純淨狀態！"
    )
    goals = [
        "使用 git mv utils.py helpers.py 將檔案更名並直接加入暫存區",
        "使用 git clean -fd 強制清理工作目錄中所有未追蹤的垃圾檔案與目錄",
        "將更名修改提交：git commit -m 'refactor: rename utils to helpers'",
        "確認工作區乾淨，且無任何雜物殘留"
    ]
    next_steps = [
        "更名檔案：git mv utils.py helpers.py",
        "預覽將被清除的未追蹤檔案：git clean -nd",
        "強制清理未追蹤檔案與目錄：git clean -fd",
        "檢查狀態：git status",
        "提交更名：git commit -m 'refactor: rename utils to helpers'",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "git clean 非常無情！清理前建議先下 -n (dry-run) 參數預覽：git clean -nd。",
        "-f 代表 force 強制執行，-d 代表包含目錄 (directories)。",
        "若連同 .gitignore 忽略的編譯產物也想一併徹底清空，可加上 -x 參數：git clean -fdx。"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # 1. 建立初始專案檔案
        utils_file = engine.workspace / "utils.py"
        utils_file.write_text("def format_currency(val):\n    return f'${val:,.2f}'\n", encoding="utf-8")
        engine.run_git("add", "utils.py")
        engine.run_git("commit", "-m", "feat: implement utility functions")

        # 2. 建立測試產生的未追蹤雜物檔案
        log_file = engine.workspace / "test_output.txt"
        log_file.write_text("[2026-10-08 TEST] Test run completed\n", encoding="utf-8")

        tmp_file = engine.workspace / "dump.tmp"
        tmp_file.write_text("BINARY_TEMP_GARBAGE_CACHE_001928\n", encoding="utf-8")

        # 3. 建立測試產生的未追蹤目錄與內部檔案
        test_dir = engine.workspace / "temp_test"
        test_dir.mkdir(exist_ok=True)
        sub_tmp = test_dir / "cache_worker.pid"
        sub_tmp.write_text("9941\n", encoding="utf-8")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. 檢查 utils.py 是否已不在工作區
        if (engine.workspace / "utils.py").exists():
            return False, "utils.py 仍然存在！請使用 git mv utils.py helpers.py 完成檔案更名。"

        # 2. 檢查 helpers.py 是否存在且內容完整
        helpers_file = engine.workspace / "helpers.py"
        if not helpers_file.exists():
            return False, "helpers.py 不存在！請確認是否已更名成功。"
        content = helpers_file.read_text(encoding="utf-8")
        if "format_currency" not in content:
            return False, "helpers.py 內容不正確！"

        # 3. 檢查未追蹤雜物是否已被 git clean 清除
        if (engine.workspace / "test_output.txt").exists():
            return False, "test_output.txt 仍殘留在工作目錄！請使用 git clean -fd 清理。"
        if (engine.workspace / "dump.tmp").exists():
            return False, "dump.tmp 仍殘留在工作目錄！請使用 git clean -fd 清理。"
        if (engine.workspace / "temp_test").exists():
            return False, "temp_test 目錄仍殘留！請確認 git clean 有加上 -d 參數以清理目錄。"

        # 4. 檢查工作區是否完全乾淨且已 commit
        _, status_out, _ = engine.run_git("status", "--porcelain")
        if status_out.strip():
            return False, "工作區尚有未提交的變更！請執行 git commit -m 'refactor: rename utils to helpers' 完成提交。"

        # 5. 檢查最新 Commit 是否為更名提交
        _, msg_out, _ = engine.run_git("log", "-1", "--pretty=%B")
        msg = msg_out.strip()
        if "helpers" not in msg.lower() and "rename" not in msg.lower():
            return False, f"最新 Commit 訊息 '{msg}' 似乎未包含更名說明，請確認 commit 訊息。"

        return True, "🎉 太乾淨了！你成功掌握了 git mv 檔案更名規範與 git clean -fd 雜物清理神技，讓代碼庫保持最高水準的整潔！"
