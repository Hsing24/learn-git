"""Automated test suite verifying all 11 scenarios setup and verification logic."""

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from lab.engine import GitEngine
from lab.scenarios.s00_config import Scenario00
from lab.scenarios.s01_basics import Scenario01
from lab.scenarios.s02_branching import Scenario02
from lab.scenarios.s03_merge_conflict import Scenario03
from lab.scenarios.s04_rebase_linear import Scenario04
from lab.scenarios.s05_rebase_interactive import Scenario05
from lab.scenarios.s06_mock_remote import Scenario06
from lab.scenarios.s07_cherry_pick import Scenario07
from lab.scenarios.s08_reflog_rescue import Scenario08
from lab.scenarios.s09_worktree import Scenario09
from lab.scenarios.s10_bisect import Scenario10
from lab.scenarios.s11_hooks import Scenario11
from lab.scenarios.s12_patch import Scenario12, INITIAL_SHOPPING_CODE, MODIFIED_SHOPPING_CODE
from lab.scenarios.s13_gitignore import Scenario13
from lab.scenarios.s14_revert_merge import Scenario14
from lab.scenarios.s15_tags import Scenario15
from lab.scenarios.s16_archaeology import Scenario16
from lab.scenarios.s17_rerere import Scenario17
from lab.scenarios.s18_amend import Scenario18
from lab.scenarios.s19_stash import Scenario19
from lab.scenarios.s20_mv_clean import Scenario20
from lab.scenarios.s21_remote_fetch import Scenario21
from lab.scenarios.s22_accidental_commit import Scenario22
from lab.scenarios.s23_plumbing import Scenario23

class TestAllScenarios(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = GitEngine(REPO_ROOT)
        cls.engine.init_repo_if_needed()

    def tearDown(self):
        self.engine.clean_workspace()

    def test_scenario_00_config(self):
        sc = Scenario00()
        sc.setup(self.engine)

        self.assertTrue((self.engine.repo_dir / "SETUP_GUIDE.md").exists())

        # Verification fails when push.autoSetupRemote is false
        self.engine.run_git("config", "push.autoSetupRemote", "false")
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Verification fails when user.name is empty
        self.engine.run_git("config", "push.autoSetupRemote", "true")
        self.engine.run_git("config", "user.name", "")
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Verification fails when user.email is empty
        self.engine.run_git("config", "user.name", "Test Student")
        self.engine.run_git("config", "user.email", "")
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Verification succeeds when all three are properly configured
        self.engine.run_git("config", "user.email", "student@example.com")
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_01_basics(self):
        sc = Scenario01()
        sc.setup(self.engine)
        
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        self.engine.run_git("add", "menu.txt", "app.py")
        self.engine.run_git("commit", "-m", "feat: initial commit for bento app")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_02_branching(self):
        sc = Scenario02()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        self.engine.run_git("checkout", "-b", "feature-discount")
        self.engine.commit_file("discount.py", "def discount(total): return total * 0.9\n", "feat: add discount calculator")
        self.engine.run_git("checkout", "main")
        self.engine.run_git("merge", "feature-discount")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_03_merge_conflict(self):
        sc = Scenario03()
        sc.setup(self.engine)

        self.assertTrue((self.engine.repo_dir / ".git" / "MERGE_HEAD").exists())
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        resolved_code = """def calculate_total(items):
    subtotal = sum(item['price'] for item in items)
    discount = 100 if subtotal >= 1000 else int(subtotal * 0.2)
    return subtotal - discount
"""
        self.engine.create_file("order.py", resolved_code)
        self.engine.run_git("add", "order.py")
        self.engine.run_git("commit", "-m", "Merge branch 'feature-promo' and resolve discount conflict")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_04_rebase_linear(self):
        sc = Scenario04()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        code, out, err = self.engine.run_git("rebase", "main")
        self.assertEqual(code, 0, f"Rebase failed: {err}")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_05_rebase_interactive(self):
        sc = Scenario05()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        self.engine.run_git("reset", "--soft", "HEAD~3")
        self.engine.run_git("commit", "-m", "feat: implement user authentication")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_06_mock_remote(self):
        sc = Scenario06()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        code, out, err = self.engine.run_git("pull", "--rebase", "origin", "main")
        self.assertEqual(code, 0)
        code, out, err = self.engine.run_git("push", "origin", "main")
        self.assertEqual(code, 0)

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_07_cherry_pick(self):
        sc = Scenario07()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        code, out, _ = self.engine.run_git("log", "--oneline", "experiment-v2")
        target_hash = None
        for line in out.splitlines():
            if "patch critical security bug" in line:
                target_hash = line.split()[0]
                break
        self.assertIsNotNone(target_hash)

        code, out, err = self.engine.run_git("cherry-pick", target_hash)
        self.assertEqual(code, 0)

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_08_reflog_rescue(self):
        sc = Scenario08()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        code, out, err = self.engine.run_git("reset", "--hard", "HEAD@{1}")
        self.assertEqual(code, 0)

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_09_worktree(self):
        sc = Scenario09()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: worktree add, fix in worktree, commit, return, merge, remove worktree
        hotfix_dir = self.engine.repo_dir / "hotfix-dir"
        self.engine.run_git("worktree", "add", "hotfix-dir", "-b", "hotfix-p0", "main")

        with open(hotfix_dir / "server.py", "w", encoding="utf-8") as f:
            f.write("# Production Server\ndef handle_request():\n    status = 'OK 200: healthy response'\n    return status\n")

        self.engine.run_git("add", "server.py", cwd=hotfix_dir)
        self.engine.run_git("commit", "-m", "fix: emergency patch for p0 bug", cwd=hotfix_dir)

        self.engine.run_git("checkout", "main")
        self.engine.run_git("merge", "hotfix-p0")
        self.engine.run_git("worktree", "remove", "hotfix-dir")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_10_bisect(self):
        sc = Scenario10()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: bisect run
        self.engine.run_git("bisect", "start")
        self.engine.run_git("bisect", "bad")
        self.engine.run_git("bisect", "good", "v1.0")

        # Automatically drive bisect until done
        while True:
            code, out, _ = self.engine.run_git("run", "python3", "test_calc.py", check=False)
            if "first bad commit" in out:
                break
            if code == 0:
                code_b, out_b, _ = self.engine.run_git("bisect", "good", check=False)
            else:
                code_b, out_b, _ = self.engine.run_git("bisect", "bad", check=False)
            if "is the first bad commit" in out_b:
                break

        # Get culprit hash
        code, out, _ = self.engine.run_git("log", "--all", "--grep=optimize arithmetic", "--format=%H")
        culprit_hash = out.strip()
        self.engine.create_file("culprit.txt", culprit_hash)
        self.engine.run_git("bisect", "reset")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_11_hooks(self):
        sc = Scenario11()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Setup hook script in .githooks
        hook_code = """#!/usr/bin/env bash
if git diff --cached | grep -E "PRIVATE_KEY|AWS_SECRET|API_TOKEN" > /dev/null; then
    echo "BLOCKED"
    exit 1
fi
exit 0
"""
        hook_path = self.engine.repo_dir / ".githooks" / "pre-commit"
        self.engine.create_file(".githooks/pre-commit", hook_code)
        import os
        os.chmod(hook_path, 0o755)
        self.engine.run_git("config", "core.hooksPath", ".githooks")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_12_patch(self):
        sc = Scenario12()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Simulate staging only hunk 1 (discount)
        partial_code = '''def calculate_total(items, discount_rate=0.1):
    # 計算購物車總金額（套用九折優惠 Bugfix）
    subtotal = sum(item["price"] * item.get("quantity", 1) for item in items)
    discount = subtotal * discount_rate
    return round(subtotal - discount, 2)


# ---------------------------------------------
# 下方為收據列印模組（相隔足夠行數以形成獨立 Hunk）
# ---------------------------------------------


def print_receipt(customer_name, items, total):
    # 列印客戶收據
    print("=== 收據 ===")
    print(f"客戶: {customer_name}")
    for item in items:
        print(f"- {item['name']}: {item['price']}")
    print(f"總計: {total}")
    print("============")
'''
        shopping_path = self.engine.workspace / "shopping.py"
        shopping_path.write_text(partial_code, encoding="utf-8")
        self.engine.run_git("add", "shopping.py")
        self.engine.run_git("commit", "-m", "fix: apply discount in total calculation")

        # Now write full modified code leaving hunk 2 unstaged
        shopping_path.write_text(MODIFIED_SHOPPING_CODE, encoding="utf-8")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_13_gitignore(self):
        sc = Scenario13()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: add .env to .gitignore, git rm --cached .env, commit
        self.engine.create_file(".gitignore", ".env\n")
        self.engine.run_git("rm", "--cached", ".env")
        self.engine.run_git("add", ".gitignore")
        self.engine.run_git("commit", "-m", "chore: stop tracking .env and add to .gitignore")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_14_revert_merge(self):
        sc = Scenario14()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: git revert -m 1 HEAD
        code, out, err = self.engine.run_git("revert", "-m", "1", "HEAD", "--no-edit")
        self.assertEqual(code, 0)

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_15_tags(self):
        sc = Scenario15()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: annotated tag v1.0.0, and annotated tag v0.9.0 on auth commit
        self.engine.run_git("tag", "-a", "v1.0.0", "-m", "Release v1.0.0")
        code, out, _ = self.engine.run_git("log", "--all", "--grep=user authentication", "--format=%H")
        auth_hash = out.strip().splitlines()[0]
        self.engine.run_git("tag", "-a", "v0.9.0", auth_hash, "-m", "Beta v0.9.0")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_16_archaeology(self):
        sc = Scenario16()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: find hash with git log -S and save to ANSWER_COMMIT.txt
        code, out, _ = self.engine.run_git("log", "-S", "CRITICAL_SECRET_TOKEN", "--format=%H")
        culprit_hash = out.strip().splitlines()[0][:7]
        self.engine.create_file("ANSWER_COMMIT.txt", culprit_hash)

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_17_rerere(self):
        sc = Scenario17()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: enable rerere, merge feature/modern-api, resolve conflict, commit
        self.engine.run_git("config", "rerere.enabled", "true")
        self.engine.run_git("merge", "feature/modern-api", check=False)

        server_path = self.engine.workspace / "server.py"
        server_path.write_text(
            "# API Gateway Core (FastAPI Enterprise)\n"
            "API_VERSION = '2.0-async-lts'\n\n"
            "def route_request(path):\n"
            "    return f'Enterprise async handler for {path}'\n",
            encoding="utf-8"
        )
        self.engine.run_git("add", "server.py")
        self.engine.run_git("commit", "-m", "merge: resolve server.py with rerere")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_18_amend(self):
        sc = Scenario18()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: git add assets/logo.png, git commit --amend -m 'feat: release v1.0.0'
        self.engine.run_git("add", "assets/logo.png")
        self.engine.run_git("commit", "--amend", "-m", "feat: release v1.0.0")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_19_stash(self):
        sc = Scenario19()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: git stash -u, switch main, hotfix on main, switch feature/cart, git stash pop
        self.engine.run_git("stash", "-u")
        self.engine.run_git("checkout", "main")
        (self.engine.workspace / "hotfix.txt").write_text("HOTFIX\n")
        self.engine.run_git("add", "hotfix.txt")
        self.engine.run_git("commit", "-m", "fix: emergency hotfix on main")
        self.engine.run_git("checkout", "feature/cart")
        self.engine.run_git("stash", "pop")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_20_mv_clean(self):
        sc = Scenario20()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: git mv utils.py helpers.py, git clean -fd, git commit
        self.engine.run_git("mv", "utils.py", "helpers.py")
        self.engine.run_git("clean", "-fd")
        self.engine.run_git("commit", "-m", "refactor: rename utils to helpers")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_21_remote_fetch(self):
        sc = Scenario21()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: read upstream_path, git remote add upstream, git fetch upstream, git merge upstream/main
        path_hint = (self.engine.workspace / "upstream_path.txt").read_text().strip()
        self.engine.run_git("remote", "add", "upstream", path_hint)
        self.engine.run_git("fetch", "upstream")
        self.engine.run_git("merge", "upstream/main", "--no-edit")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_22_accidental_commit(self):
        sc = Scenario22()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: git branch feature/oauth, git switch main, git reset --hard HEAD~2
        self.engine.run_git("branch", "feature/oauth")
        self.engine.run_git("checkout", "main")
        self.engine.run_git("reset", "--hard", "HEAD~2")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_23_plumbing(self):
        sc = Scenario23()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # User steps: inspect blob hash of app.py and write into inspection.txt
        _, ls_out, _ = self.engine.run_git("ls-tree", "HEAD", "app.py")
        parts = ls_out.strip().split()
        blob_hash = parts[2]
        (self.engine.workspace / "inspection.txt").write_text(blob_hash + "\n", encoding="utf-8")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

if __name__ == "__main__":
    unittest.main()
