"""Additional curriculum labs; all remotes, credentials and keys stay in the sandbox."""
import json
import re
import shutil
import subprocess
from pathlib import Path
from lab.base import BaseScenario


def output(e, *args, cwd=None):
    code, out, _ = e.run_git(*args, cwd=cwd, check=False)
    return out.strip() if code == 0 else ""


def remember(e, level, key, value):
    e.run_git("config", f"lab.scenario{level}.{key}", value)


def recalled(e, level, key):
    return output(e, "config", "--get", f"lab.scenario{level}.{key}")


def ended(e, cwd=None):
    gitdir = output(e, "rev-parse", "--absolute-git-dir", cwd=cwd)
    return bool(gitdir) and not any((Path(gitdir) / name).exists() for name in (
        "MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply", "BISECT_START"))


class Scenario36(BaseScenario):
    id = "36"
    title = '建立倉庫：Git Init 與三區模型'
    difficulty = "入門 🔰"
    story = "你收到只有檔案的新專案；先建立儲存庫，理解工作目錄、index 與 commit 的關係。"
    goals = ["確認目前沒有 .git", "git init -b main", "設定本地 user.name 與 user.email", "git add README.md，再 commit 初始快照"]
    next_steps = ["git init -b main", 'git config user.name "Learner"', 'git config user.email "learner@example.com"', "git add README.md", 'git commit -m "feat: initialize project"', "./git-lab verify"]
    hints = ["init 建立 .git，並不自動追蹤現有檔案。", "add 將當下內容放入 index；commit 記錄 index。"]

    def setup(self, e):
        e.clean_workspace()
        shutil.rmtree(e.repo_dir / ".git")
        e.create_file("README.md", "# New project\n")

    def verify(self, e):
        if not (e.repo_dir / ".git").is_dir():
            return False, "請先用 git init -b main 建立儲存庫。"
        ok = (bool(output(e, "config", "--local", "user.name"))
              and bool(output(e, "config", "--local", "user.email"))
              and e.get_current_branch() == "main" and e.get_commit_count() == 1
              and output(e, "show", "HEAD:README.md") == "# New project"
              and ended(e) and not output(e, "diff", "HEAD", "--", "README.md"))
        return ok, "初始快照已提交。" if ok else "請在 main 提交 README.md 的初始快照。"


class Scenario37(BaseScenario):
    id = "37"
    title = '提交快照：暫存後再修改'
    difficulty = "入門 🔰"
    story = "你把版本二暫存後又改成版本三；提交應保留已審查的版本二，版本三留在工作目錄。"
    goals = ["將 note.txt 改成 version 2 並 git add", "暫存後再改成 version 3", "commit 提交 version 2，保留 version 3 的未暫存修改"]
    next_steps = ["printf 'version 2\\n' > note.txt", "git add note.txt", "printf 'version 3\\n' > note.txt", "git diff; git diff --cached", 'git commit -m "feat: reviewed version 2"', "./git-lab verify"]
    hints = ["commit 使用 index；add 之後的工作目錄修改不會自動被提交。", "不要用 commit -a，它會再次暫存已追蹤檔案。"]

    def setup(self, e):
        e.clean_workspace()
        e.commit_file("note.txt", "version 1\n", "base")
        remember(e, self.id, "base", e.get_head_hash())

    def verify(self, e):
        ok = (output(e, "show", "HEAD:note.txt") == "version 2"
              and e.read_file("note.txt") == "version 3\n"
              and output(e, "show", ":note.txt") == "version 2"
              and output(e, "rev-parse", "HEAD^") == recalled(e, self.id, "base")
              and e.get_commit_count() == 2 and ended(e))
        return ok, "HEAD/index 是版本二，工作目錄保留版本三。" if ok else "請提交已暫存的 version 2，並把 version 3 留在工作目錄。"


class Scenario38(BaseScenario):
    id = "38"
    title = '共享歷史：Revert 一般提交'
    difficulty = "初階 ⭐⭐"
    story = "公開分支的設定有錯；新增反向提交修正它，讓同事已有的歷史保持可追溯。"
    goals = ["查看錯誤 commit", "git revert HEAD --no-edit", "確認新增反向提交且原提交仍在歷史"]
    next_steps = ["git show HEAD", "git revert HEAD --no-edit", "git log --oneline", "./git-lab verify"]
    hints = ["revert 新增 commit；reset 會移動分支，並不符合此任務。"]

    def setup(self, e):
        e.clean_workspace()
        e.commit_file("config.txt", "mode=safe\n", "base")
        e.commit_file("config.txt", "mode=broken\n", "enable broken mode")
        remember(e, self.id, "bad", e.get_head_hash())

    def verify(self, e):
        ok = (e.get_commit_count() == 3 and ended(e)
              and output(e, "rev-parse", "HEAD^") == recalled(e, self.id, "bad")
              and output(e, "show", "HEAD:config.txt") == "mode=safe"
              and not output(e, "diff", "HEAD", "--", "config.txt"))
        return ok, "反向提交保留了原有歷史。" if ok else "請新增 revert commit，保留原錯誤提交與 safe 設定。"


class Scenario39(BaseScenario):
    id = "39"
    title = '遠端分歧：FF-only 與整合策略'
    difficulty = "初階 ⭐⭐"
    story = "同事和你同時提交；先確認 ff-only 無法整合分歧，再明確選 merge 或 rebase，最後推送。"
    goals = ["git fetch origin", "git merge --ff-only origin/main 會拒絕分歧", "選擇 merge origin/main 或 rebase origin/main", "推送並保留雙方檔案"]
    next_steps = ["git fetch origin", "git merge --ff-only origin/main", "git log --oneline --graph --all", "git merge origin/main --no-edit（或 git rebase origin/main）", "git push origin main", "./git-lab verify"]
    hints = ["ff-only 拒絕分歧時，不會丟掉提交。", "本關的本地提交尚未共享，可選 rebase；已共享歷史通常選 merge。"]

    def setup(self, e):
        e.clean_workspace()
        e.commit_file("base.txt", "base\n", "base")
        remote = e.workspace / ".git-lab-sync.git"
        e.run_git("clone", "--bare", str(e.workspace), str(remote))
        e.run_git("remote", "add", "origin", str(remote))
        e.run_git("fetch", "origin")
        e.run_git("branch", "--set-upstream-to=origin/main", "main")
        e.commit_file("local.txt", "local feature\n", "local work")
        peer = e.workspace / ".git-lab-peer"
        e.run_git("clone", str(remote), str(peer))
        (peer / "peer.txt").write_text("peer feature\n")
        e.run_git("add", "peer.txt", cwd=peer)
        e.run_git("commit", "-m", "peer work", cwd=peer)
        remember(e, self.id, "peer", output(e, "rev-parse", "HEAD", cwd=peer))
        e.run_git("push", "origin", "main", cwd=peer)
        shutil.rmtree(peer)

    def verify(self, e):
        peer = recalled(e, self.id, "peer")
        remote = e.workspace / ".git-lab-sync.git"
        ok = (ended(e) and e.get_current_branch() == "main"
              and e.run_git("merge-base", "--is-ancestor", peer, "HEAD", check=False)[0] == 0
              and output(e, "show", "HEAD:local.txt") == "local feature"
              and output(e, "show", "HEAD:peer.txt") == "peer feature"
              and output(e, "rev-parse", "main", cwd=remote) == e.get_head_hash()
              and not output(e, "diff", "HEAD", "--", "local.txt", "peer.txt"))
        return ok, "雙方提交已整合並推送。" if ok else "請整合 origin/main，保留 local.txt 與 peer.txt，完成推送。"


class Scenario40(BaseScenario):
    id = "40"
    title = '連線排查：作者、驗證與權限'
    difficulty = "初階 ⭐⭐"
    story = "姓名信箱設定正確仍推送失敗。閱讀模擬 SSH/HTTPS 錯誤，區分作者資料、認證、URL 與倉庫權限；不連外。"
    goals = ["git remote -v 與 git config --show-origin --get user.email", "閱讀 AUTH_CASES.md", "在 diagnosis.json 分別填寫 author/authentication/url/permission"]
    next_steps = ["git remote -v", "cat AUTH_CASES.md", 'printf \'{"case1":"authentication","case2":"url","case3":"permission","case4":"author"}\\n\' > diagnosis.json', "./git-lab verify"]
    hints = ["user.email 只寫入 commit；不授予 GitHub 登入或寫入權限。", "Permission denied (publickey) 檢查 SSH key；repository URL 與帳戶寫入權限分別檢查。"]

    def setup(self, e):
        e.clean_workspace()
        e.run_git("remote", "add", "origin", "git@example.invalid:team/wrong-repo.git")
        e.create_file("AUTH_CASES.md", "# 離線錯誤案例\ncase1: SSH Permission denied (publickey)，未提供授權的 key。\ncase2: HTTPS URL 的 owner/repo 拼錯，Repository not found。\ncase3: 已認證但帳戶僅有 read 權限，write access denied。\ncase4: commit 作者 email 拼錯。\n\nSSH 與 HTTPS 是不同認證路徑；HTTPS 使用平台支援的 token/credential helper。\nRepository not found 也可能隱藏私有倉庫權限，真實情況需同時查 URL 與權限。\n本關只讀本地案例，勿執行遠端連線；不儲存密碼或 token。\n")

    def verify(self, e):
        try:
            answers = json.loads(e.read_file("diagnosis.json") or "{}")
        except (ValueError, TypeError):
            return False, "diagnosis.json 必須是有效 JSON。"
        ok = answers == {"case1": "authentication", "case2": "url", "case3": "permission", "case4": "author"}
        return ok, "已區分作者、認證、URL 與權限。" if ok else "請根據四個離線案例填寫 diagnosis.json。"


class Scenario41(BaseScenario):
    id = "41"
    title = '排除檔案：Ignore 模式與例外'
    difficulty = "初階 ⭐⭐"
    story = "略過 log、build 產物和資料目錄，但保留 data/keep.csv；用 check-ignore 解釋規則。"
    goals = [".gitignore 使用 *.log、build/、data/* 與 !data/keep.csv", "git check-ignore -v 驗證規則", "提交 .gitignore 與保留的資料"]
    next_steps = ["printf '*.log\\nbuild/\\ndata/*\\n!data/keep.csv\\n' > .gitignore", "git check-ignore -v trace.log build/output.bin data/drop.csv", "git add .gitignore data/keep.csv", 'git commit -m "chore: ignore generated files"', "./git-lab verify"]
    hints = ["若直接忽略 data/ 整個父目錄，Git 不會往下搜尋，!data/keep.csv 無法單独救回。", "check-ignore -v 顯示來源、行號與匹配規則；退出碼 1 代表沒有忽略匹配。"]

    def setup(self, e):
        e.clean_workspace()
        e.commit_file("README.md", "# Ignore rules\n", "base")
        for name in ("trace.log", "build/output.bin", "data/drop.csv", "data/keep.csv"):
            e.create_file(name, "sample\n")

    def verify(self, e):
        ignored = all(e.run_git("check-ignore", "-q", name, check=False)[0] == 0
                      for name in ("trace.log", "build/output.bin", "data/drop.csv"))
        policy_committed = not output(e, "diff", "HEAD", "--", ".gitignore") and not output(e, "diff", "--cached", "--", ".gitignore")
        ok = (ignored and policy_committed and e.run_git("check-ignore", "--no-index", "-q", "data/keep.csv", check=False)[0] == 1
              and output(e, "show", "HEAD:data/keep.csv") == "sample"
              and bool(output(e, "show", "HEAD:.gitignore"))
              and all(not output(e, "ls-files", "--", name) for name in ("trace.log", "build/output.bin", "data/drop.csv"))
              and e.get_commit_count() == 2 and ended(e))
        return ok, "產物被忽略，例外資料已提交。" if ok else "請忽略三種產物並提交 .gitignore 與 data/keep.csv。"


class Scenario42(BaseScenario):
    id = "42"
    title = '跨平台協作：Attributes 與換行'
    difficulty = "CLI 選修 ⭐⭐⭐"
    story = "Windows 的 CRLF 檔案造成雜訊；用 .gitattributes 固定版本庫的 LF，避免依賴每台機器的全域設定。"
    goals = ["設定 *.txt text eol=lf", "git add --renormalize .", "提交並檢查 blob 換行與 check-attr"]
    next_steps = ["printf '*.txt text eol=lf\\n' > .gitattributes", "git add .gitattributes", "git add --renormalize .", 'git commit -m "chore: normalize line endings"', "git check-attr text eol -- lines.txt", "./git-lab verify"]
    hints = ["eol 決定工作目錄換行；text 正規化讓 index/commit 使用 LF。", "renormalize 重新處理已追蹤檔案，不自動加入新檔案。"]

    def setup(self, e):
        e.clean_workspace()
        e.run_git("config", "core.autocrlf", "false")
        (e.workspace / "lines.txt").write_bytes(b"one\r\ntwo\r\n")
        e.run_git("add", "lines.txt")
        e.run_git("commit", "-m", "base CRLF")

    def verify(self, e):
        code, blob, _ = e.run_git("show", "HEAD:lines.txt", check=False)
        raw = subprocess.run(["git", "show", "HEAD:lines.txt"], cwd=e.workspace, capture_output=True).stdout
        ok = (code == 0 and raw == b"one\ntwo\n" and e.get_commit_count() == 2
              and "lines.txt: eol: lf" in output(e, "check-attr", "--cached", "eol", "--", "lines.txt")
              and bool(output(e, "show", "HEAD:.gitattributes"))
              and not output(e, "diff", "HEAD", "--", ".gitattributes")
              and not output(e, "diff", "--cached", "--", ".gitattributes") and ended(e))
        return ok, "版本庫內容已正規化為 LF。" if ok else "請提交 attributes 與 renormalize 後的 LF blob。"


class Scenario43(BaseScenario):
    id = "43"
    title = '調整提交：Split Commit 與 Range-diff'
    difficulty = "CLI 選修 ⭐⭐⭐⭐"
    story = "尚未共享的 commit 同時改了兩個模組；停在 edit，mixed reset 後拆成兩筆，用 range-diff 比較。"
    goals = ["備份原序列 old-series", "git rebase -i HEAD~1 將 pick 改 edit", "git reset HEAD^，分別 add/commit alpha.py 與 beta.py", "rebase --continue；git range-diff main..old-series main..feature"]
    next_steps = ["git rebase -i HEAD~1（pick 改為 edit）", "git reset HEAD^", 'git add alpha.py && git commit -m "feat: alpha"', 'git add beta.py && git commit -m "feat: beta"', "git rebase --continue", "git range-diff main..old-series main..feature", "./git-lab verify"]
    hints = ["mixed reset 讓 HEAD 回到 parent，內容仍留在工作目錄而 index 重設。", "range-diff 比較兩個提交序列的補丁配對；拆分後可能顯示未配對，不代表程式遺失。"]

    def setup(self, e):
        e.clean_workspace()
        e.commit_file("README.md", "# Split\n", "base")
        e.run_git("switch", "-c", "feature")
        e.create_file("alpha.py", "ALPHA = True\n")
        e.create_file("beta.py", "BETA = True\n")
        e.run_git("add", "alpha.py", "beta.py")
        e.run_git("commit", "-m", "feat: alpha and beta")
        e.run_git("branch", "old-series")

    def verify(self, e):
        commits = output(e, "rev-list", "--reverse", "main..feature").splitlines()
        ok = ended(e) and e.get_current_branch() == "feature" and len(commits) == 2
        if ok:
            ok = (output(e, "diff-tree", "--no-commit-id", "--name-only", "-r", commits[0]) == "alpha.py"
                  and output(e, "diff-tree", "--no-commit-id", "--name-only", "-r", commits[1]) == "beta.py"
                  and output(e, "rev-parse", "feature^{tree}") == output(e, "rev-parse", "old-series^{tree}")
                  and output(e, "rev-parse", "feature~2") == output(e, "rev-parse", "main"))
        return ok, "兩個補丁分開提交，最終 tree 保持一致。" if ok else "請拆成 alpha 與 beta 各一筆提交，完成 rebase 並保留全部內容。"


class Scenario44(BaseScenario):
    id = "44"
    title = '閱讀歷史：修訂參照與範圍'
    difficulty = "進階 ⭐⭐⭐"
    story = "分支圖有 merge；分清第一 parent、祖先步數，以及兩點與三點的提交集合和 diff 差異。"
    goals = ["讀 git log --graph --all", "比較 HEAD^、HEAD~2 與 HEAD^2", "將 git rev-list 的 A..B 與 A...B 結果寫入 ranges.json"]
    next_steps = ["git log --graph --oneline --all", "git rev-parse HEAD^ HEAD~2 HEAD^2", "git rev-list --reverse A..B", "git rev-list --reverse A...B", "依 RANGES_GUIDE.md 填 ranges.json", "./git-lab verify"]
    hints = ["A..B 是 B 可達但 A 不可達；A...B 是兩方獨有的對稱差。", "git diff A...B 是 merge-base 到 B 的差；不是 log 的對稱差集合。"]

    def setup(self, e):
        e.clean_workspace()
        e.commit_file("base.txt", "base\n", "base")
        e.run_git("branch", "B")
        e.commit_file("a.txt", "A\n", "A change")
        e.run_git("branch", "A")
        e.run_git("switch", "B")
        e.commit_file("b.txt", "B\n", "B change")
        e.run_git("switch", "main")
        e.run_git("merge", "--no-ff", "B", "-m", "merge B")
        e.create_file("RANGES_GUIDE.md", '# 回答格式\n建立 ranges.json，值均是完整 hash：\n{"parent":"HEAD^ 的 hash","ancestor":"HEAD~2 的 hash","secondParent":"HEAD^2 的 hash","twoDot":["A..B hash"],"threeDot":["A...B 的所有 hash"]}\n陣列不要求排序。HEAD^n 選第 n 個 parent；HEAD~n 沿第一 parent 走 n 步。\nlog A...B 與 diff A...B 的意義不同。\n')

    def verify(self, e):
        try:
            answers = json.loads(e.read_file("ranges.json") or "{}")
            if not isinstance(answers, dict) or set(answers) != {"parent", "ancestor", "secondParent", "twoDot", "threeDot"}:
                return False, "ranges.json 必須是含三個 revision 與兩個陣列的 JSON object。"
            is_hash = lambda value: isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", value))
            if not all(is_hash(answers[key]) for key in ("parent", "ancestor", "secondParent")) or not all(
                isinstance(answers[key], list) and all(is_hash(value) for value in answers[key])
                and len(answers[key]) == len(set(answers[key])) for key in ("twoDot", "threeDot")):
                return False, "revision 應是完整 hash，範圍應是無重複的 hash 陣列。"
            expected = {key: output(e, "rev-parse", ref) for key, ref in (
                ("parent", "HEAD^"), ("ancestor", "HEAD~2"), ("secondParent", "HEAD^2"))}
            ok = all(answers.get(k) == v for k, v in expected.items())
            ok = ok and all(set(answers.get(k, [])) == set(output(e, "rev-list", ref).splitlines())
                            for k, ref in (("twoDot", "A..B"), ("threeDot", "A...B")))
        except (ValueError, TypeError):
            ok = False
        return ok, "revision 與提交集合回答正確。" if ok else "請依分支圖填入正確完整 hash 與兩種集合。"


class Scenario45(BaseScenario):
    id = "45"
    title = '自動定位：Bisect Run'
    difficulty = "CLI 選修 ⭐⭐⭐"
    story = "用可重複測試找出首次失敗的提交，並區分不適合測試的 125 與工具缺失的 127。"
    goals = ["git bisect start HEAD good", "git bisect run python3 check.py", "記錄 first bad hash 到 culprit.txt，再 git bisect reset"]
    next_steps = ["cat BISECT_GUIDE.md", "git bisect start HEAD good", "git bisect run python3 check.py", "git rev-parse HEAD > culprit.txt", "git bisect reset", "./git-lab verify"]
    hints = ["0=good；1–127 除 125 外=bad；125=skip；其他值中止 bisect run。", "127 常代表 command not found，不能當作 regression；Git 可能檢查後中止，仍應先確認測試工具存在。"]

    def setup(self, e):
        e.clean_workspace()
        e.commit_file("calc.py", "RESULT = 4\n", "base")
        e.run_git("tag", "good")
        for i in range(1, 6):
            e.commit_file("calc.py", f"RESULT = {5 if i >= 3 else 4}\n# step {i}\n", f"step {i}")
            if i == 3:
                remember(e, self.id, "bad", e.get_head_hash())
        remember(e, self.id, "tip", e.get_head_hash())
        e.create_file("check.py", "import runpy, sys\nsys.exit(0 if runpy.run_path('calc.py')['RESULT'] == 4 else 1)\n")
        e.create_file("BISECT_GUIDE.md", "先執行 python3 check.py 確認測試能啟動。退出碼 0 good，1–127（除125）bad，125 skip，其餘中止。127 通常是工具找不到，不能當作程式 regression；Git 可能檢查可疑退出碼後中止；在 wrapper 預檢工具並用 >=128 退出。\n")

    def verify(self, e):
        ok = (ended(e) and (e.read_file("culprit.txt") or "").strip() == recalled(e, self.id, "bad")
              and e.get_head_hash() == recalled(e, self.id, "tip") and e.get_current_branch() == "main")
        return ok, "已找到首次回歸並退出 bisect。" if ok else "請記錄正確 first bad hash，並以 bisect reset 回原分支。"


class Scenario46(BaseScenario):
    id = "46"
    title = '縮減複製：Partial Clone 與 Shallow Clone'
    difficulty = "CLI 選修 ⭐⭐⭐⭐"
    story = "用沙盒本地 file:// server 比較物件過濾與歷史深度，理解兩者不同限制。"
    goals = ["partial clone --filter=blob:none --no-checkout", "shallow clone --depth=1；先 verify 記錄真正 shallow 邊界", "git fetch --unshallow 後確認完整歷史"]
    next_steps = ["cat CLONE_GUIDE.md", 'git clone --filter=blob:none --no-checkout "file://$PWD/.git-lab-server.git" partial', 'git clone --depth=1 "file://$PWD/.git-lab-server.git" shallow', "./git-lab verify（先驗證 partial 缺少 blob 與 shallow 邊界；此步尚未通關）", "git -C shallow fetch --unshallow", "./git-lab verify"]
    hints = ["直接路徑的 local clone 可能忽略 depth/filter，這裡要使用 file://。", "partial 限制初始物件下載，shallow 限制提交歷史；sparse 限制工作目錄。"]

    def setup(self, e):
        e.clean_workspace()
        for i in range(3):
            e.commit_file("data.txt", f"payload {i}\n", f"step {i}")
        server = e.workspace / ".git-lab-server.git"
        e.run_git("clone", "--bare", str(e.workspace), str(server))
        e.run_git("config", "uploadpack.allowFilter", "true", cwd=server)
        e.create_file("CLONE_GUIDE.md", "本關僅本地 file://，server 啟用 uploadpack.allowFilter。\npartial: --filter=blob:none --no-checkout，checkout 可能 lazy fetch blob；不保證永不下載。\nshallow: --depth=1，缺乏完整祖先；先執行 ./git-lab verify 記錄真實 shallow 邊界（尚未通關），再 fetch --deepen=N 或 --unshallow 補歷史，最後 verify。\nsparse-checkout 只改工作目錄呈現。\n")

    def verify(self, e):
        partial, shallow = e.workspace / "partial", e.workspace / "shallow"
        if not (partial / ".git").is_dir() or not (shallow / ".git").is_dir():
            return False, "請建立 partial 與 shallow clone。"
        expected_blobs = set()
        for commit in output(e, "rev-list", "HEAD").splitlines():
            # Default ls-tree columns are available on the course minimum Git 2.28.
            for entry in output(e, "ls-tree", "-r", commit).splitlines():
                metadata = entry.split("\t", 1)[0].split()
                if len(metadata) == 3 and metadata[1] == "blob":
                    expected_blobs.add(metadata[2])
        missing = {line[1:] for line in output(e, "rev-list", "--objects", "--all", "--missing=print", cwd=partial).splitlines() if line.startswith("?")}
        partial_ok = (output(e, "config", "remote.origin.promisor", cwd=partial) == "true"
              and output(e, "config", "remote.origin.partialclonefilter", cwd=partial) == "blob:none"
              and output(e, "rev-parse", "HEAD", cwd=partial) == e.get_head_hash()
              and not (partial / "data.txt").exists()
              and missing == expected_blobs and bool(missing)
              and any((partial / ".git/objects/pack").glob("*.promisor")))
        if not partial_ok:
            return False, "partial 必須是真正 blob:none/no-checkout clone：需有 promisor pack 與缺少的 blob 物件，僅手動設定 config 不算。"
        boundary = shallow / ".git/shallow"
        if output(e, "rev-parse", "--is-shallow-repository", cwd=shallow) == "true":
            if (not boundary.is_file() or boundary.read_text().strip() != e.get_head_hash()
                    or output(e, "rev-list", "--count", "HEAD", cwd=shallow) != "1"):
                return False, "請以 --depth=1 建立 shallow clone，保留目前 HEAD 的真實 shallow 邊界。"
            remember(e, self.id, "boundary", boundary.read_text().strip())
            return False, "第一階段已確認 partial 缺少 blob 與 depth=1 邊界；現在 git -C shallow fetch --unshallow，再 verify。"
        ok = (recalled(e, self.id, "boundary") == e.get_head_hash()
              and not boundary.exists()
              and output(e, "rev-parse", "HEAD", cwd=shallow) == e.get_head_hash()
              and output(e, "rev-list", "--count", "HEAD", cwd=shallow) == "3")
        return ok, "已驗證真實 partial clone 與 shallow 邊界，再補全歷史。" if ok else "請先在 shallow 仍為 depth=1 時執行 verify 記錄邊界，再 fetch --unshallow；直接完整 clone 不算 shallow 練習。"



class Scenario47(BaseScenario):
    id = "47"
    title = '大型資產：Git LFS 指標與工具'
    difficulty = "CLI 選修 ⭐⭐⭐"
    story = "大型檔案以 LFS 指標納入 Git；實際內容另存在 LFS object store。本關需另裝 git-lfs，不連外。"
    goals = ["先確認 git lfs version", "git lfs install --local", 'git lfs track "*.bin"', "提交 .gitattributes 與 asset.bin，驗證 pointer 與本地 object"]
    next_steps = ["git lfs install --local", 'git lfs track "*.bin"', "git add .gitattributes asset.bin", 'git commit -m "feat: track binary with LFS"', "git lfs ls-files", "./git-lab verify"]
    hints = ["Git LFS 是額外工具；尚未安裝時本關會明確回報前置條件。", "track 只改 attributes，需重新 add；LFS server、配額與權限仍由平台另行管理。"]

    def setup(self, e):
        if e.run_git("lfs", "version", check=False)[0] != 0:
            raise RuntimeError("選修 47 前置條件：請先安裝 git-lfs（git lfs version 必須成功）。")
        e.clean_workspace()
        e.commit_file("README.md", "# LFS\n", "base")
        e.create_file("asset.bin", "binary payload for local LFS exercise\n")

    def verify(self, e):
        pointer = output(e, "show", "HEAD:asset.bin")
        oid = re.search(r"^oid sha256:([0-9a-f]{64})$", pointer, re.M)
        ok = bool(oid) and pointer.startswith("version https://git-lfs.github.com/spec/v1\n")
        if ok:
            digest = oid.group(1)
            obj = e.workspace / ".git/lfs/objects" / digest[:2] / digest[2:4] / digest
            ok = (obj.is_file() and obj.read_bytes() == (e.workspace / "asset.bin").read_bytes()
                  and "filter=lfs" in output(e, "show", "HEAD:.gitattributes") and ended(e))
        return ok, "Git 提交的是 LFS pointer，原始內容存在本地 LFS store。" if ok else "請安裝本地 LFS hooks，提交 attributes 與有效 pointer，保留實際檔案。"


class Scenario48(BaseScenario):
    id = "48"
    title = '驗證來源：SSH 提交與標籤簽章'
    difficulty = "CLI 選修 ⭐⭐⭐⭐"
    story = "在練習沙盒產生一次性 SSH signing key，簽署 commit/tag 並以 allowed_signers 驗證；不使用家目錄金鑰。"
    goals = ["Git >=2.34 且 ssh-keygen 支援 -Y", "依 SIGNING_GUIDE.md 產生沙盒 key 與 allowed_signers", "git commit -S 與 git tag -s", "git verify-commit HEAD、git verify-tag signed-v1"]
    next_steps = ["cat SIGNING_GUIDE.md", "ssh-keygen -t ed25519 -N '' -f .git/lab-signing-key", "git config gpg.format ssh", 'git config user.signingkey "$PWD/.git/lab-signing-key"', 'printf "learner@example.com %s\\n" "$(cat .git/lab-signing-key.pub)" > .git/allowed_signers', 'git config gpg.ssh.allowedSignersFile "$PWD/.git/allowed_signers"', 'git add signed.txt && git commit -S -m "feat: signed change"', 'git tag -s signed-v1 -m "Signed release"', "git verify-commit HEAD; git verify-tag signed-v1", "./git-lab verify"]
    hints = ["本關金鑰只放 workspace/.git，reset 時刪除；不要上傳私鑰。", "作者姓名/信箱與 SSH signing 信任名單是不同機制；annotated tag 不自動具備簽章。"]

    def setup(self, e):
        version = re.search(r"(\d+)\.(\d+)", output(e, "--version"))
        if not version or tuple(map(int, version.groups())) < (2, 34) or not shutil.which("ssh-keygen"):
            raise RuntimeError("選修 48 前置條件：Git 2.34+ 與支援 SSH signing 的 ssh-keygen。")
        probe = subprocess.run(["ssh-keygen", "-Y", "find-principals"], capture_output=True, text=True)
        if "unknown option" in probe.stderr.lower() or "illegal option" in probe.stderr.lower():
            raise RuntimeError("選修 48 前置條件：ssh-keygen 必須支援 -Y signing。")
        e.clean_workspace()
        e.commit_file("README.md", "# Signing\n", "base")
        e.create_file("signed.txt", "signed change\n")
        e.create_file("SIGNING_GUIDE.md", "本關只使用 .git/lab-signing-key，一次性測試 key 使用空 passphrase；真實個人金鑰請設定 passphrase 並依組織信任政策保護。\n依 next_steps 設定 gpg.format、user.signingkey、allowedSignersFile。allowed_signers 的 principal 是 learner@example.com，後面接完整 .pub 內容。\ncommit -S 簽署提交；tag -s 簽署 tag object。驗證通過只代表符合目前本地信任名單；不自動代表平台驗證或團隊信任。\n")

    def verify(self, e):
        ok = (e.get_commit_count() == 2 and ended(e)
              and output(e, "show", "HEAD:signed.txt") == "signed change"
              and output(e, "rev-parse", "signed-v1^{commit}") == e.get_head_hash()
              and output(e, "log", "-1", "--format=%GS") == "learner@example.com"
              and e.run_git("verify-commit", "HEAD", check=False)[0] == 0
              and e.run_git("verify-tag", "signed-v1", check=False)[0] == 0)
        return ok, "commit 與 annotated tag 的 SSH 簽章已通過本地信任驗證。" if ok else "請簽署提交與 signed-v1，並設定 allowed_signers 讓兩者驗證成功。"
