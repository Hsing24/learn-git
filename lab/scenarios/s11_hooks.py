"""Scenario 11: Git Hooks automation and security guardrails."""

import os
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

PRE_COMMIT_TEMPLATE = """#!/usr/bin/env bash
# Git pre-commit hook: 敏感金鑰攔截守門員

echo "🔍 正在執行 pre-commit 程式碼安全檢查..."

# 檢查暫存區 (Staged) 的檔案是否包含敏感詞彙
if git diff --cached | grep -E "PRIVATE_KEY|AWS_SECRET|API_TOKEN" > /dev/null; then
    echo "❌ [安全警報] 檢測到代碼中包含敏感金鑰 (PRIVATE_KEY / AWS_SECRET / API_TOKEN)！"
    echo "🚨 Git 已攔截此次提交，請將敏感資訊移至環境變數 (.env) 後再試。"
    exit 1
fi

echo "✔ 安全檢查通過，允許 Commit！"
exit 0
"""

class Scenario11(BaseScenario):
    id = "11"
    title = "守門神器：Git Hooks 自動化品管與敏感金鑰攔截"
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "軟體開發團隊最常面臨的兩大痛點：\n"
        "1. 資安慘劇：工程師手滑把 API Token、AWS 密鑰或資料庫密碼 commit 進版本庫（推上 GitHub 秒被黑客爬取！）。\n"
        "2. 規範失控：有人沒跑 Linter 就提交代碼，或 commit 訊息亂打一通（如 'wip', 'asdf'）。\n"
        "Git 內建的自動化守門員就是「Git Hooks」！\n"
        "它可以在 commit、push 等動作觸發前後自動執行腳本。若腳本回傳非 0，Git 就會立即中止操作，防患於未然！"
    )
    goals = [
        "觀察 Git 內部預設存放 Hooks 的位置 (.git/hooks/)",
        "建立一個 pre-commit 鉤子腳本並賦予執行權限 (chmod +x)",
        "在 pre-commit 中加入檢查邏輯：若發現 PRIVATE_KEY 或 API_TOKEN 則阻止提交",
        "故意在檔案寫入金鑰並嘗試 commit，親自體驗被 Git 守門員擋下的安全機制",
        "理解團隊如何透過 git config core.hooksPath .githooks 實現跨成員共享 Hooks"
    ]
    next_steps = [
        "查看範本指引：cat HOOKS_GUIDE.md",
        "建立 hook 檔案：在 .git/hooks/pre-commit (或 .githooks/pre-commit) 寫入檢查腳本",
        "賦予執行權限：chmod +x .git/hooks/pre-commit (或 chmod +x .githooks/pre-commit)",
        "若使用 .githooks 目錄，需設定：git config core.hooksPath .githooks",
        "驗收成果：./git-lab verify"
    ]
    hints = [
        "最簡單的做法：在 .git/hooks/ 目錄下建立名為 pre-commit 的可執行腳本。",
        "腳本第一行必須是 #!/usr/bin/env bash，並記得執行 chmod +x .git/hooks/pre-commit。",
        "你可以直接參考 HOOKS_GUIDE.md 內提供的標準範例腳本貼上使用！"
    ]

    def setup(self, engine: GitEngine) -> None:
        engine.clean_workspace()
        engine.run_git("checkout", "-B", "main", check=False)

        # Base commit
        engine.commit_file("app.py", "# Clean application\nprint('Hello Secure World')\n", "feat: initial safe app")

        # Create tutorial guide file in workspace
        guide = """# 🛡️ Git Hooks 實戰手冊

Git Hooks 是存放在 Git 儲存庫中的事件腳本。常見鉤子包括：
- `pre-commit`：在輸入 commit 訊息前執行。常用於：格式化 (Prettier)、語法檢查 (ESLint/Ruff)、**機密資訊攔截**。
- `commit-msg`：檢查提交訊息格式（例如強制遵循 Conventional Commits：`feat:`, `fix:`）。
- `pre-push`：在推送前執行單元測試，避免把爛代碼推上遠端。

---

## 🚀 任務指引

請在工作區中建立一個可執行的 `pre-commit` 腳本：

### 做法 A：直接寫入 `.git/hooks/pre-commit`
```bash
cat << 'EOF' > .git/hooks/pre-commit
#!/usr/bin/env bash
if git diff --cached | grep -E "PRIVATE_KEY|AWS_SECRET|API_TOKEN" > /dev/null; then
    echo "❌ 偵測到敏感資訊！拒絕 Commit。"
    exit 1
fi
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### 做法 B（團隊最佳實踐）：使用 `.githooks` 並納入版本控制
因為 `.git/hooks/` 預設不會被 Git 追蹤，團隊成員無法共享。現代做法是：
```bash
mkdir -p .githooks
# 將 pre-commit 寫在 .githooks/pre-commit
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```
"""
        engine.create_file("HOOKS_GUIDE.md", guide)

    def verify(self, engine: GitEngine) -> Tuple[bool, str]:
        # Check if hook exists either in .git/hooks/pre-commit or core.hooksPath
        hook_path = None
        
        # Check custom hooksPath first
        code, custom_path_out, _ = engine.run_git("config", "core.hooksPath", check=False)
        if code == 0 and custom_path_out.strip():
            candidate = engine.repo_dir / custom_path_out.strip() / "pre-commit"
            if candidate.exists():
                hook_path = candidate
        
        if not hook_path:
            candidate = engine.repo_dir / ".git" / "hooks" / "pre-commit"
            if candidate.exists():
                hook_path = candidate

        if not hook_path:
            return False, "尚未找到 pre-commit 鉤子腳本！請確認已建立在 .git/hooks/pre-commit 或自訂的 core.hooksPath 下。"

        # Check executable permissions
        if not os.access(hook_path, os.X_OK):
            return False, f"腳本 '{hook_path.name}' 缺少執行權限！請執行：chmod +x {hook_path}"

        # Test the hook functionality: try to commit a file with PRIVATE_KEY
        test_leak_file = "secret_leak.txt"
        engine.create_file(test_leak_file, "API_TOKEN = 'secret-xyz-123456'\n")
        engine.run_git("add", test_leak_file)

        # Attempt commit - should FAIL because hook intercepts it
        code, out, err = engine.run_git("commit", "-m", "test leak", check=False)

        # Cleanup test file
        engine.run_git("reset", "HEAD", test_leak_file, check=False)
        try:
            (engine.repo_dir / test_leak_file).unlink()
        except Exception:
            pass

        if code == 0:
            return False, "pre-commit 鉤子未能攔截含有 API_TOKEN 的提交！請確保腳本在發現敏感詞時以 exit 1 退出。"

        return True, "太棒了！你的 Git Hook 守門員成功攔截了潛在的資安洩漏！從此為專案裝上了堅不可摧的安全氣囊！"
