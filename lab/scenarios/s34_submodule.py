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
        if not engine.file_exists(".gitmodules"):
            return False, "尚未產生 .gitmodules 配置檔！請執行 git submodule add 加入子模組。"

        code, out, _ = engine.run_git("submodule", "status", check=False)
        if not out.strip():
            return False, "子模組尚未成功掛載或未正確註冊！"

        return True, "太棒了！你學會了以 Git Submodule 跨專案共用代碼與固定版本！"
