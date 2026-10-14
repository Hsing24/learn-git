"""Scenario 00: Git Identity Config, SSH Setup & Push AutoSetupRemote."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario00(BaseScenario):
    id = "00"
    title = '入職設定：提交作者身分'
    difficulty = "新手必備 🔰"
    story = "新專案需要正確作者姓名與信箱；這些資料記錄在 commit，遠端認證另於 40 練習。"
    goals = ["設定本地 user.name 與 user.email", "用 git config --show-origin 查看設定來源", "可選：Git 2.37+ 的 push.autoSetupRemote true"]
    next_steps = ['git config user.name "你的名字"', 'git config user.email "you@example.com"', "git config --show-origin --get user.email", "./git-lab verify"]
    hints = ["本關使用 repo 本地設定；--global 影響所有專案，僅在需要時自行選擇。", "姓名與信箱是作者資料，不是 SSH/HTTPS 認證。", "push.autoSetupRemote 是可選便利設定，支援的 default push 模式會自動建立 upstream；不是 SSH 登入。"]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.create_file("SETUP_GUIDE.md", "# 作者身分設定\n\n設定 user.name 與 user.email，使用 git config --show-origin 查看來源。\n設定範圍：system < global < local；環境變數也可覆寫提交作者。\n本關使用 local，--global 由使用者自行選擇。\n作者資料不授予遠端權限；SSH/HTTPS 認證請見 40。\n可選 Git 2.37+：git config push.autoSetupRemote true，適用 default push 的 simple/upstream/current 模式。\n")

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # 1. Check user.name
        code, name_out, _ = engine.run_git("config", "user.name", check=False)
        name = name_out.strip()
        if code != 0 or not name:
            return False, (
                "尚未設定 Git 使用者名稱 (user.name)。\n"
                "請在終端機執行：git config user.name \"你的名字\"（或加上 --global）"
            )

        # 2. Check user.email
        code, email_out, _ = engine.run_git("config", "user.email", check=False)
        email = email_out.strip()
        if code != 0 or not email:
            return False, (
                "尚未設定 Git 使用者信箱 (user.email)。\n"
                "請在終端機執行：git config user.email \"你的信箱@example.com\"（或加上 --global）"
            )

        # 3. Check push.autoSetupRemote (Optional Bonus)
        code, auto_out, _ = engine.run_git("config", "--bool", "push.autoSetupRemote", check=False)
        has_auto = (code == 0 and auto_out.strip() == "true")
        bonus = "\n⭐ [解鎖進階神器成就] push.autoSetupRemote 已啟用！" if has_auto else "\n💡 [推薦可選小撇步] 可執行 git config push.autoSetupRemote true 體驗免敲 --set-upstream！"

        return True, (
            "恭喜完成起點裝備設定！\n"
            f"目前配置檢測結果：\n"
            f"  • user.name: {name} (必備 ✔)\n"
            f"  • user.email: {email} (必備 ✔)\n"
            f"  • push.autoSetupRemote: {'true (已啟用)' if has_auto else 'false (可選)'}{bonus}"
        )
