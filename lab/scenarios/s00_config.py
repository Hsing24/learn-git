"""Scenario 00: Git Identity Config, SSH Setup & Push AutoSetupRemote."""

from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

class Scenario00(BaseScenario):
    id = "00"
    title = "起點裝備：Git 身分配置、SSH 憑證與自動建立遠端分支"
    difficulty = "新手必備 🔰"
    story = (
        "工欲善其事，必先利其器！在開始任何 Git 專案之前，有三套至關重要的「起點裝備」必須就緒：\n"
        "1. 身分印記 (user.name & user.email)：Git 每次 commit 都必須記載作者與提交者。\n"
        "   若未配置，Git 會直接報錯（fatal: unable to auto-detect email address）並拒絕提交！\n"
        "   在開源與團隊協作中，這也是追蹤貢獻與問責不可或缺的基礎。\n"
        "2. 免密連線 (SSH 金鑰 & Credential Helper)：每次 push 都要輸入帳號密碼是所有新手的惡夢。\n"
        "   透過非對稱加密的 SSH 金鑰（如現代推薦的 Ed25519）或系統憑證小幫手（credential.helper），\n"
        "   能讓你在安全無虞的前提下，實現完全免輸入密碼的極速推送工作流！\n"
        "3. 推送神技 (push.autoSetupRemote true)：Git 2.37+ 引入的救星配置！\n"
        "   以往新建分支第一次推送時，若沒加 --set-upstream origin <branch> 就會被 Git 擋下。\n"
        "   啟用 push.autoSetupRemote 後，新建分支只要直接輸入 git push，Git 就會聰明地\n"
        "   自動在遠端建立同名分支並建立追蹤，徹底擺脫手動敲指令的煩躁感！"
    )
    goals = [
        "檢查並設定 git config 的 user.name 與 user.email (可在本地 repo 或全域設定)",
        "設定 git config push.autoSetupRemote true (告別 --set-upstream origin <branch>)",
        "了解 SSH 金鑰產生指令 (ssh-keygen -t ed25519) 與 GitHub 綁定步驟",
        "了解 credential.helper 與 SSH 免密推送機制"
    ]
    next_steps = [
        "設定姓名：git config user.name \"你的名字或暱稱\" (或加上 --global)",
        "設定信箱：git config user.email \"你的信箱@example.com\" (或加上 --global)",
        "開啟自動遠端分支：git config push.autoSetupRemote true (建議加上 --global)",
        "閱讀工作區內的 SETUP_GUIDE.md 深入了解 SSH 免密與憑證機制",
        "完成後執行：./git-lab verify"
    ]
    hints = [
        "【第一步：配置使用者身分】\n"
        "在終端機執行：\n"
        "  git config user.name \"你的名字\"\n"
        "  git config user.email \"你的信箱@example.com\"\n"
        "💡 提示：若希望整台電腦的所有專案都套用，加上 --global 參數即可（例：git config --global user.name \"Alice\"）。",

        "【第二步：配置自動建立遠端分支 (Git 2.37+ 必備)】\n"
        "在終端機執行：\n"
        "  git config push.autoSetupRemote true\n"
        "💡 提示：非常推薦全域啟用（git config --global push.autoSetupRemote true），以後任何新分支只要鍵入 git push 就能直接推上遠端！",

        "【第三步：SSH 免密金鑰與憑證管理速查】\n"
        "1. 產生目前業界推薦最高強度的 Ed25519 金鑰：\n"
        "   ssh-keygen -t ed25519 -C \"你的信箱@example.com\"\n"
        "   (連按 Enter 接受預設路徑與空白密碼)\n"
        "2. 複製公鑰內容：\n"
        "   macOS: pbcopy < ~/.ssh/id_ed25519.pub\n"
        "   Linux: cat ~/.ssh/id_ed25519.pub\n"
        "3. 前往 GitHub -> Settings -> SSH and GPG keys -> New SSH Key 貼上並儲存。\n"
        "4. 測試連線：ssh -T git@github.com\n"
        "💡 若使用 HTTPS 協定，可透過憑證小幫手記住密碼/PAT：\n"
        "   macOS: git config --global credential.helper osxkeychain\n"
        "   Windows: git config --global credential.helper wincred\n"
        "   Linux: git config --global credential.helper cache"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()

        guide_content = """# 🛠️ Git 起點裝備指南：身分設定、SSH 免密連線與自動追蹤

歡迎來到 **Git Scenario Lab**！在展開你的版本控制探險前，讓我們先把最重要的基礎環境配備妥當。

---

## 1. 為什麼必須設定 `user.name` 與 `user.email`？

Git 是一個分散式版本控制系統，歷史紀錄中的每一個 Commit 節點，都會永久記錄兩項作者資訊：
- **Author (作者)**：最初撰寫這段程式碼的人。
- **Committer (提交者)**：將這個補丁提交進版本庫的人。

若未設定姓名與信箱，當你執行 `git commit` 時，Git 將無法確認作者身分，並直接拋出致命錯誤：
```text
fatal: unable to auto-detect email address (got 'user@machine.(none)')
```

### ⚙️ 設定指令：
```bash
# 僅在當前專案生效（本地設定）
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 在這台電腦的所有 Git 專案皆生效（推薦全域設定）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 2. 告別 `--set-upstream`：`push.autoSetupRemote true`

### 痛點場景：
當你在本地新建了一個功能分支並完成開發：
```bash
git checkout -b feature-payment
git commit -m "feat: add payment gateway"
git push
```
預設情況下，Git 會冷酷地拒絕推送並噴出長篇錯誤：
```text
fatal: The current branch feature-payment has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin feature-payment
```
每次換新分支都要複製貼上 `--set-upstream origin ...` 極度繁瑣且打斷思緒。

### 🚀 解法（Git 2.37+ 救星）：
```bash
# 開啟自動設定遠端追蹤分支
git config push.autoSetupRemote true

# 推薦直接全域生效
git config --global push.autoSetupRemote true
```
開啟後，只要在新分支輸入 `git push`，Git 就會自動判斷遠端若無同名分支，直接建立並綁定 upstream 追蹤關係！

---

## 3. 免密推送雙雄：SSH Key vs. Credential Helper

每次與 GitHub / GitLab 互動時，如果都要手動輸入帳號與密碼（或 Personal Access Token, PAT），效率會極低。業界有兩種主流的免密解法：

### 方案 A：SSH 金鑰連線（業界最推薦 ⭐⭐⭐⭐⭐）
採用非對稱加密：
- **私鑰 (Private Key)**：存放在本機 `~/.ssh/id_ed25519`，絕對不能洩漏給任何人。
- **公鑰 (Public Key)**：上傳至 GitHub Settings -> SSH and GPG keys。

#### 快速設定三部曲：
1. **產生現代高效且安全的 Ed25519 金鑰**：
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   # 一路按 Enter（使用預設路徑且不設定 pass phrase）
   ```
2. **複製公鑰內容**：
   ```bash
   # macOS:
   pbcopy < ~/.ssh/id_ed25519.pub
   # Linux / WSL:
   cat ~/.ssh/id_ed25519.pub
   ```
3. **在 GitHub 貼上公鑰**：
   前往 GitHub 網頁 -> `Settings` -> `SSH and GPG keys` -> 點擊 `New SSH Key` -> 貼上並儲存。
4. **驗證連線**：
   ```bash
   ssh -T git@github.com
   # 看到 "Hi <username>! You've successfully authenticated..." 即代表成功！
   ```

### 方案 B：HTTPS 搭配憑證小幫手 (Credential Helper)
若專案使用 HTTPS 網址 clone，可讓系統憑證庫幫你安全記憶 Token：
```bash
# macOS (存入 macOS 鑰匙圈 Keychain)
git config --global credential.helper osxkeychain

# Windows (存入 Windows 認證管理員)
git config --global credential.helper wincred

# Linux (暫存在記憶體 1 小時)
git config --global credential.helper 'cache --timeout=3600'
```

---

## 4. 本關卡通關檢查清單

請在終端機（workspace 目錄下）完成以下設定：
1. `git config user.name "你的名字"` (或 `--global`)
2. `git config user.email "你的信箱@example.com"` (或 `--global`)
3. `git config push.autoSetupRemote true` (或 `--global`)
4. 完成後執行 `./git-lab verify` 通關！
"""
        engine.create_file("SETUP_GUIDE.md", guide_content)

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
