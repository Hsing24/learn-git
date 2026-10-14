"""Scenario 11: Git Hooks automation and security guardrails."""

import os
import tempfile
import subprocess
from pathlib import Path
from typing import Tuple
from lab.base import BaseScenario
from lab.engine import GitEngine

PRE_COMMIT_TEMPLATE = """#!/usr/bin/env bash
# Git pre-commit hook: 敏感金鑰攔截守門員

echo "🔍 正在執行 pre-commit 程式碼安全檢查..."

# 檢查暫存區 (Staged) 的檔案是否包含敏感詞彙
if git diff --cached --no-ext-diff --unified=0 | grep -E "^[+][^+].*(PRIVATE_KEY|AWS_SECRET|API_TOKEN)" > /dev/null; then
    echo "❌ [安全警報] 檢測到代碼中包含敏感金鑰 (PRIVATE_KEY / AWS_SECRET / API_TOKEN)！"
    echo "🚨 Git 已攔截此次提交，請將敏感資訊移至環境變數 (.env) 後再試。"
    exit 1
fi

echo "✔ 安全檢查通過，允許 Commit！"
exit 0
"""

class Scenario11(BaseScenario):
    id = "11"
    title = '提交檢查：Hooks 攔截與修正'
    difficulty = "實戰 ⭐⭐⭐⭐"
    story = (
        "昨天你差點把包含敏感金鑰的設定檔推上遠端，嚇得資安前輩阿威差點拔網路線。\n"
        "為了保護全組生命安全，阿威要求你在本地配置 pre-commit hook 守門腳本，\n"
        "在 commit 前自動攔截違規與敏感字眼！"
    )
    goals = [
        "觀察 Git 內部預設存放 Hooks 的位置 (.git/hooks/)",
        "建立一個 pre-commit 鉤子腳本並賦予執行權限 (chmod +x)",
        "在 pre-commit 中加入檢查邏輯：若發現 PRIVATE_KEY 或 API_TOKEN 則阻止提交",
        "故意在檔案寫入金鑰並嘗試 commit，親自體驗被 Git 守門員擋下的安全機制",
        "清除金鑰後正常 commit，不需 --no-verify；共享 .githooks 後每位 clone 者須執行安裝 bootstrap 設定 hooksPath"
    ]
    next_steps = [
        "查看範本指引：cat HOOKS_GUIDE.md",
        "建立 hook 檔案：在 .git/hooks/pre-commit (或 .githooks/pre-commit) 寫入檢查腳本",
        "賦予執行權限：chmod +x .git/hooks/pre-commit (或 chmod +x .githooks/pre-commit)",
        "若使用 .githooks 目錄，需設定：git config core.hooksPath .githooks",
        "git add settings.py，再 git commit -m 'test secret'，確認 hook 拒絕",
        "將 settings.py 改為 import os 與 TOKEN = os.environ.get('SERVICE_TOKEN') 兩行",
        "git add settings.py，再 git commit -m 'feat: safe settings'；正常提交，不要 --no-verify",
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
if git diff --cached --no-ext-diff --unified=0 | grep -E "^[+][^+].*(PRIVATE_KEY|AWS_SECRET|API_TOKEN)" > /dev/null; then
    echo "❌ 偵測到敏感資訊！拒絕 Commit。"
    exit 1
fi
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### 做法 B（團隊最佳實踐）：使用 `.githooks` 並納入版本控制
`.git/hooks/` 不會被 clone；版本控制 `.githooks` 後，每位使用者仍須自行執行 bootstrap 或 hooksPath 安裝。clone 不會自動啟用腳本：
```bash
mkdir -p .githooks
# 將 pre-commit 寫在 .githooks/pre-commit
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```
"""
        engine.create_file("HOOKS_GUIDE.md", guide)
        engine.create_file("settings.py", "API_TOKEN = 'sandbox-secret'\n")

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

        # A temporary index keeps verify read-only for the learner's staged changes/history.
        with tempfile.TemporaryDirectory(prefix="git-lab-hook-") as tmp:
            index = str(Path(tmp) / "index")
            env = {"GIT_INDEX_FILE": index}
            engine.run_git("read-tree", "HEAD", env=env)
            def probe(content):
                hashed = subprocess.run(["git", "hash-object", "-w", "--stdin"], input=content,
                    cwd=engine.workspace, capture_output=True, text=True, check=True).stdout.strip()
                engine.run_git("update-index", "--add", "--cacheinfo", "100644", hashed, "hook-probe.txt", env=env)
                process_env = os.environ.copy()
                process_env.update(env)
                return subprocess.run([str(hook_path.resolve())], cwd=engine.workspace,
                    env=process_env, capture_output=True, text=True).returncode
            if probe("API_TOKEN = 'sandbox-secret'\n") == 0:
                return False, "pre-commit 必須攔截含 API_TOKEN 的暫存內容。"
            if probe("SAFE_SETTING = True\n") != 0:
                return False, "移除金鑰後 hook 必須允許正常提交，不能只一律拒絕。"
        code, settings, _ = engine.run_git("show", "HEAD:settings.py", check=False)
        if code != 0 or settings != "import os\nTOKEN = os.environ.get('SERVICE_TOKEN')\n":
            return False, "請在 hook 阻擋後移除 settings.py 的金鑰，改讀環境變數並正常提交。"
        return True, "Hook 會攔截金鑰並允許清除後的正常提交；clone 者需自行安裝共享 hooks。"
