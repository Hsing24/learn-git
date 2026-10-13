"""Scenario 34: Git Submodule Management."""

import shutil
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario34(BaseScenario):
    id = "34"
    title = "跨專案代碼復用：Git Submodule 子模組"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "專案需要共用外部函式庫，但希望保持獨立版本歷史。\n"
        "實驗室已建立好模擬子倉庫 .git-lab-sub-34。\n"
        "請使用 git submodule add 掛載子模組至 libs/shared 並完成提交！"
    )
    goals = [
        "掛載子模組：git -c protocol.file.allow=always submodule add ./.git-lab-sub-34 libs/shared",
        "提交子模組指針：git commit -m 'feat: add shared submodule'",
        "確認 .gitmodules 存在且已納入追蹤"
    ]
    next_steps = [
        "加入子模組：git -c protocol.file.allow=always submodule add ./.git-lab-sub-34 libs/shared",
        "提交配置：git commit -m 'feat: add shared submodule'",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "執行 git -c protocol.file.allow=always submodule add ./.git-lab-sub-34 libs/shared 加入子模組。",
        "執行 git commit -am 'feat: add shared submodule' 完成提交。",
        "輸入 ./git-lab verify 驗收成果！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "print('main app')\n", "feat: base app")

        # Setup local bare sub repository
        sub_path = engine.repo_dir / ".git-lab-sub-34"
        if sub_path.exists():
            shutil.rmtree(sub_path, ignore_errors=True)
        sub_path.mkdir(parents=True, exist_ok=True)

        engine.run_git("-C", str(sub_path), "init", "--bare", "-b", "main")

        # Populate a commit in sub repo
        temp_work = engine.repo_dir / ".git-lab-sub-temp"
        if temp_work.exists():
            shutil.rmtree(temp_work, ignore_errors=True)
        engine.run_git("clone", str(sub_path), str(temp_work))
        (temp_work / "lib.py").write_text("def shared_fn(): return 42\n", encoding="utf-8")
        engine.run_git("-C", str(temp_work), "add", "lib.py")
        engine.run_git("-C", str(temp_work), "commit", "-m", "feat: initial lib")
        engine.run_git("-C", str(temp_work), "push", "origin", "main")
        shutil.rmtree(temp_work, ignore_errors=True)

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        code, gitlink, _ = engine.run_git("ls-tree", "HEAD", "libs/shared", check=False)
        fields = gitlink.strip().split()
        if code != 0 or len(fields) != 4 or fields[:2] != ["160000", "commit"] or fields[3] != "libs/shared":
            return False, "HEAD 尚未提交 libs/shared 的 gitlink！請先加入子模組並 commit。"

        code, committed_modules, _ = engine.run_git("show", "HEAD:.gitmodules", check=False)
        if code != 0:
            return False, "HEAD 尚未提交 .gitmodules！請加入子模組設定後 commit。"

        code, configured_path, _ = engine.run_git(
            "config", "--blob", "HEAD:.gitmodules", "--get", "submodule.libs/shared.path", check=False
        )
        code2, configured_url, _ = engine.run_git(
            "config", "--blob", "HEAD:.gitmodules", "--get", "submodule.libs/shared.url", check=False
        )
        if code != 0 or code2 != 0 or configured_path.strip() != "libs/shared":
            return False, "提交的 .gitmodules 必須註冊 libs/shared。"

        configured_source = Path(configured_url.strip())
        if not configured_source.is_absolute():
            configured_source = engine.workspace / configured_source
        expected_source = engine.repo_dir / ".git-lab-sub-34"
        if configured_source.resolve() != expected_source.resolve():
            return False, "libs/shared 必須連到本關建立的模擬子倉庫。"

        expected_commit_code, expected_commit, _ = engine.run_git(
            "-C", str(expected_source), "rev-parse", "refs/heads/main", check=False
        )
        if expected_commit_code != 0 or fields[2] != expected_commit.strip():
            return False, "HEAD 的 gitlink 必須固定在模擬子倉庫的 main 提交。"

        code, out, _ = engine.run_git("submodule", "status", "--", "libs/shared", check=False)
        if code != 0 or not out.startswith(" "):
            return False, "子模組工作目錄尚未檢出 HEAD 記錄的提交，請確認子模組狀態。"

        return True, "太棒了！你學會了以 Git Submodule 跨專案共用代碼與固定版本！"
