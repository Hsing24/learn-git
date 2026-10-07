"""Scenario 10: Bug hunting with Git Bisect."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

TEST_CODE = '''import calc
try:
    assert calc.add(2, 3) == 5, "2 + 3 應該等於 5"
    print("✔ 測試通過：計算邏輯正確")
except Exception as e:
    print(f"❌ 測試崩潰：{e}")
    exit(1)
'''

class Scenario10(BaseScenario):
    id = "10"
    title = "時光偵探：Git Bisect 二分搜尋秒殺神秘 Bug"
    difficulty = "實戰 ⭐⭐⭐⭐⭐"
    story = (
        "專案在最近幾天累積了連續多個 Commit。\n"
        "QA 回報：目前 HEAD 最新版執行 python3 test_calc.py 會直接報錯 Crash！\n"
        "但在 5 個 commit 前的標籤 v1.0，測試完全正常通過。\n"
        "中間歷經多次重構，肉眼逐一排查極為浪費時間。\n"
        "請使用 Git 的二分搜尋利器 git bisect，用最少的步驟精準揪出引入 Bug 的元凶 Commit！"
    )
    goals = [
        "執行 git bisect start 啟動二分偵探工作流",
        "標記當前有問題的版本：git bisect bad",
        "標記良好版本：git bisect good v1.0",
        "Git 會自動幫你切換 Commit，每次執行 python3 test_calc.py 驗證：通過就打 git bisect good，報錯就打 git bisect bad",
        "直到 Git 印出 '... is the first bad commit'，將該 7 碼 Hash 存入 culprit.txt，並執行 git bisect reset 退出除錯！"
    ]
    next_steps = [
        "啟動二分搜尋：git bisect start",
        "標記目前損壞：git bisect bad",
        "標記初始正常：git bisect good v1.0",
        "執行測試：python3 test_calc.py",
        "根據測試回傳 good 或 bad，直到鎖定元凶 Hash",
        "寫入元凶：echo '<hash>' > culprit.txt",
        "退出搜尋：git bisect reset",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "步驟：輸入 git bisect start -> git bisect bad -> git bisect good v1.0。",
        "Git 會在中繼點停下，這時執行 python3 test_calc.py，看到紅字報錯就輸入 git bisect bad，綠字就輸入 git bisect good。",
        "重覆兩三次後，Git 會指出哪一個 commit 是 first bad commit。把它的 hash 開頭 7 碼寫進 culprit.txt（例如 echo 'a1b2c3d' > culprit.txt），再輸入 git bisect reset 完成任務！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base good commit with tag v1.0
        engine.commit_file("calc.py", "def add(a, b):\n    return a + b\n", "feat: initial calculator engine")
        engine.commit_file("test_calc.py", TEST_CODE, "test: add calculator test suite")
        engine.run_git("tag", "v1.0")

        # Innocuous commits
        engine.commit_file("README.md", "# Calculator Service\n", "docs: update readme documentation")
        engine.commit_file("calc.py", "def add(a, b):\n    # add two numbers\n    return a + b\n", "refactor: add comments to calc")

        # The BAD commit (bug introduced: a - b instead of a + b)
        engine.commit_file("calc.py", "def add(a, b):\n    return a - b  # oops typo\n", "perf: optimize arithmetic calculations")

        # More commits on top
        engine.commit_file("utils.py", "def log_info(msg): print(msg)\n", "feat: add logger utility")
        engine.commit_file("README.md", "# Calculator Service v1.1\n", "docs: update version tag in readme")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if bisect is still in progress
        bisect_start = engine.repo_dir / ".git" / "BISECT_START"
        if bisect_start.exists():
            return False, "Git Bisect 尚未結束！找出元凶後請執行 git bisect reset 退出除錯狀態。"

        # Check culprit.txt
        if not engine.file_exists("culprit.txt"):
            return False, "尚未建立 culprit.txt 檔案！請將找到的元凶 Commit Hash 寫入 culprit.txt。"

        culprit = engine.read_file("culprit.txt")
        if not culprit:
            return False, "culprit.txt 內容為空！"

        culprit = culprit.strip().lower()

        # Find the actual bad commit hash
        code, out, _ = engine.run_git("log", "--grep=optimize arithmetic", "--format=%H", check=False)
        real_bad_hash = out.strip().lower()

        if not real_bad_hash or (culprit not in real_bad_hash and real_bad_hash[:7] not in culprit):
            return False, f"你回報的 Commit Hash '{culprit}' 不是真正引入 Bug 的 Commit！請再次確認。"

        return True, "神探無誤！你成功運用 git bisect 在成千上萬的提交中以 O(log N) 的極速鎖定了 Bug 源頭！"
