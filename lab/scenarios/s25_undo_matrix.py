"""Scenario 25: Undo Matrix (restore, restore --staged, reset --soft)."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario25(BaseScenario):
    id = "25"
    title = '撤銷操作：Restore 與三種 Reset'
    difficulty = "初階 ⭐⭐"
    story = (
        "今天下午衰神附體，接連犯了三個錯：手滑改壞 config.py（未暫存）、不小心把 debug.log 暫存進去了、\n"
        "還手抖提前 commit 了半成品 wip。別慌！拿出現代 Git 後悔藥對照表，精準對症下藥，逐一復原案發現場！"
    )
    goals = [
        "在 reset-soft/reset-mixed/reset-hard 三個沙盒各執行 git reset --soft/--mixed/--hard HEAD^，比較 HEAD、index、工作目錄",
        "使用 git restore config.py 放棄工作區未暫存的修改",
        "使用 git restore --staged debug.log 取消暫存（檔案保留在硬碟）",
        "使用 git reset --soft HEAD~1 撤銷半成品 commit",
        "重新提交：git commit -m \"feat: complete payment feature\""
    ]
    next_steps = [
        "還原工作區：git restore config.py",
        "取消暫存：git restore --staged debug.log",
        "軟撤銷提交：git reset --soft HEAD~1",
        "重新提交：git commit -m \"feat: complete payment feature\"",
        "git -C reset-soft reset --soft HEAD^",
        "git -C reset-mixed reset --mixed HEAD^",
        "git -C reset-hard reset --hard HEAD^（只在可丟棄的 reset-hard 沙盒）",
        "各用 git -C <目錄> status 與 diff --cached 比較，再 ./git-lab verify"
    ]
    hints = [
        "執行 git restore config.py 可以直接捨棄工作區修改。",
        "執行 git restore --staged debug.log 可以將 debug.log 移出暫存區。",
        "執行 git reset --soft HEAD~1 可以撤銷上次 commit 並保留修改於暫存區。",
        "重新 commit 後執行 ./git-lab verify 通關！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("config.py", "API_HOST = 'https://api.prod'\n", "feat: payment base")
        engine.run_git("config", "lab.scenario25.base", engine.get_head_hash() or "")

        # wip commit
        engine.commit_file("payment.py", "def process(): pass\n", "wip: half done")

        # 1. Broken config.py in working tree
        engine.create_file("config.py", "API_HOST = 'BROKEN_URL'\n")

        # 2. Accidental debug.log staged
        engine.create_file("debug.log", "debug secret\n")
        engine.run_git("add", "debug.log")

        for mode in ("soft", "mixed", "hard"):
            directory = engine.workspace / f"reset-{mode}"
            directory.mkdir()
            engine.run_git("init", "-b", "main", cwd=directory)
            (directory / "demo.txt").write_text("base\n")
            engine.run_git("add", "demo.txt", cwd=directory)
            engine.run_git("commit", "-m", "base", cwd=directory)
            _, base, _ = engine.run_git("rev-parse", "HEAD", cwd=directory)
            engine.run_git("config", "lab.resetbase", base.strip(), cwd=directory)
            (directory / "demo.txt").write_text("change\n")
            engine.run_git("add", "demo.txt", cwd=directory)
            engine.run_git("commit", "-m", "change", cwd=directory)

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        if engine.get_current_branch() != "main":
            return False, "請在 main 分支上完成重新提交。"

        expected_config = "API_HOST = 'https://api.prod'\n"
        if engine.read_file("config.py") != expected_config:
            return False, "config.py 仍有未復原的工作區修改！請執行 git restore config.py。"

        if not engine.file_exists("debug.log"):
            return False, "debug.log 檔案消失了！請確認使用 restore --staged（移出暫存而非刪除實體檔案）。"
        code, _, _ = engine.run_git("ls-files", "--error-unmatch", "debug.log", check=False)
        if code == 0:
            return False, "debug.log 仍被 Git 追蹤！請執行 git restore --staged debug.log，讓它保留在硬碟但不進入提交。"

        code, staged_out, _ = engine.run_git("diff", "--cached", "--name-only", check=False)
        if staged_out.strip():
            return False, "仍有不該提交的暫存變更！請確認 debug.log 已取消暫存後再重建提交。"

        code, expected_parent, _ = engine.run_git("config", "--get", "lab.scenario25.base", check=False)
        code2, actual_parent, _ = engine.run_git("rev-parse", "HEAD^", check=False)
        code3, parent_config, _ = engine.run_git("show", "HEAD^:config.py", check=False)
        if (
            code != 0 or code2 != 0 or code3 != 0
            or actual_parent.strip() != expected_parent.strip()
            or parent_config != expected_config
        ):
            return False, "最新提交的 parent 並非原本的 payment base！請用 reset --soft 保留半成品內容後重建提交。"

        code, head_config, _ = engine.run_git("show", "HEAD:config.py", check=False)
        if code != 0 or head_config != expected_config:
            return False, "最新提交仍包含錯誤的 config.py！請先 restore，再重新提交正確功能。"

        code, payment, _ = engine.run_git("show", "HEAD:payment.py", check=False)
        if code != 0 or payment != "def process(): pass\n":
            return False, "最新提交沒有保留 payment.py 的半成品功能，請以 reset --soft 重建提交。"

        code, tracked_debug, _ = engine.run_git("cat-file", "-e", "HEAD:debug.log", check=False)
        if code == 0:
            return False, "debug.log 被提交進 HEAD！請取消暫存後再提交功能修正。"

        count = engine.get_commit_count()
        if count != 2:
            return False, f"預期倉庫內應有 2 個 commit（base + 重新提交的 feature），目前有 {count} 個。"

        for mode in ("soft", "mixed", "hard"):
            directory = engine.workspace / f"reset-{mode}"
            if not (directory / ".git").is_dir() or not (directory / "demo.txt").is_file():
                return False, f"請保留 reset-{mode} 的練習儲存庫與檔案。"
            _, base, _ = engine.run_git("config", "--get", "lab.resetbase", cwd=directory, check=False)
            _, head, _ = engine.run_git("rev-parse", "HEAD", cwd=directory, check=False)
            _, index, _ = engine.run_git("show", ":demo.txt", cwd=directory, check=False)
            expected_index = "change\n" if mode == "soft" else "base\n"
            expected_work = "base\n" if mode == "hard" else "change\n"
            if not base.strip() or head != base or index != expected_index or (directory / "demo.txt").read_text() != expected_work:
                return False, f"reset-{mode} 尚未呈現正確 HEAD/index/工作目錄結果，請依模式練習 reset。"

        return True, "太棒了！你完美駕馭了 restore、restore --staged 與 reset --soft 的現代後悔藥組合！"
