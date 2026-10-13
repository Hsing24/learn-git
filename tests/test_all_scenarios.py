"""Automated acceptance tests for all 36 CLI scenarios and curriculum consistency."""

import os
import shutil
import subprocess
import sys
import tempfile
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
from lab.scenarios.s24_inspect_changes import Scenario24
from lab.scenarios.s25_undo_matrix import Scenario25
from lab.scenarios.s26_merge_strategies import Scenario26
from lab.scenarios.s27_detached_head import Scenario27
from lab.scenarios.s28_clone_and_track import Scenario28
from lab.scenarios.s29_rebase_conflict import Scenario29
from lab.scenarios.s30_fixup_autosquash import Scenario30
from lab.scenarios.s31_pr_lifecycle import Scenario31
from lab.scenarios.s32_rebase_onto import Scenario32
from lab.scenarios.s33_secret_purge import Scenario33
from lab.scenarios.s34_submodule import Scenario34
from lab.scenarios.s35_sparse_checkout import Scenario35

class TestAllScenarios(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original_git_env = {
            key: value for key, value in os.environ.items() if key.startswith("GIT_")
        }
        for key in cls.original_git_env:
            os.environ.pop(key, None)

        cls.test_project = tempfile.TemporaryDirectory(prefix="learn-git-tests-")
        cls.project_root = Path(cls.test_project.name)
        shutil.copy2(REPO_ROOT / "git-lab", cls.project_root / "git-lab")
        shutil.copytree(REPO_ROOT / "lab", cls.project_root / "lab")
        (cls.project_root / "docs").mkdir()
        shutil.copy2(REPO_ROOT / "docs" / "curriculum.js", cls.project_root / "docs" / "curriculum.js")
        global_config = cls.project_root / "empty-global-gitconfig"
        global_config.write_text("", encoding="utf-8")
        os.environ.update({
            "GIT_CONFIG_GLOBAL": str(global_config),
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_AUTHOR_NAME": "Test User",
            "GIT_AUTHOR_EMAIL": "test@learn-git.local",
            "GIT_COMMITTER_NAME": "Test User",
            "GIT_COMMITTER_EMAIL": "test@learn-git.local",
            "GIT_EDITOR": "true",
            "GIT_SEQUENCE_EDITOR": "true",
        })

        cls.engine = GitEngine(cls.project_root)
        cls.engine.init_repo_if_needed()

    @classmethod
    def tearDownClass(cls):
        for key in [key for key in os.environ if key.startswith("GIT_")]:
            os.environ.pop(key, None)
        os.environ.update(cls.original_git_env)
        cls.test_project.cleanup()

    def tearDown(self):
        self.engine.clean_workspace()

    def test_scenario_00_config(self):
        sc = Scenario00()
        sc.setup(self.engine)

        self.assertTrue((self.engine.repo_dir / "SETUP_GUIDE.md").exists())

        # Verification fails when user.name is empty
        self.engine.run_git("config", "user.name", "")
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Verification fails when user.email is empty
        self.engine.run_git("config", "user.name", "Test User")
        self.engine.run_git("config", "user.email", "")
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Verification succeeds when required user.name and user.email are configured (even if autoSetupRemote is not set)
        self.engine.run_git("config", "user.email", "user@example.com")
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

        # Verification also succeeds with bonus when push.autoSetupRemote is true
        self.engine.run_git("config", "push.autoSetupRemote", "true")
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

        # Let Git run the documented test and use its exit status to classify commits.
        code, out, err = self.engine.run_git(
            "bisect", "run", "python3", "test_calc.py", check=False
        )
        self.assertEqual(code, 0, f"Bisect run failed: {err or out}")

        # Bisect leaves HEAD at the first bad commit, independent of its output wording.
        code, culprit_hash, err = self.engine.run_git("rev-parse", "HEAD", check=False)
        self.assertEqual(code, 0, f"Could not resolve first bad commit: {err}")
        self.engine.create_file("culprit.txt", culprit_hash.strip())
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

    def test_scenario_24_inspect_changes(self):
        sc = Scenario24()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        _, status, _ = self.engine.run_git("status", "-s")
        self.assertIn("M  utils.py", status)
        self.assertIn(" M app.py", status)
        self.assertIn("?? notes.txt", status)
        _, unstaged, _ = self.engine.run_git("diff")
        self.assertIn("wip", unstaged)
        self.assertNotIn("def sub", unstaged)
        _, staged, _ = self.engine.run_git("diff", "--staged")
        self.assertIn("def sub", staged)
        _, graph, _ = self.engine.run_git("log", "--oneline", "--graph")
        self.assertIn("feat: update main logic", graph)
        _, previous, _ = self.engine.run_git("show", "HEAD~1")
        self.assertIn("feat: add helper", previous)

        self.engine.create_file("ANSWER.txt", "unstaged\n")
        self.assertFalse(sc.verify(self.engine)[0])
        self.engine.create_file("ANSWER.txt", "staged\n")
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_25_undo_matrix(self):
        sc = Scenario25()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        # Amending the wip commit with the broken config and secret must not pass.
        self.engine.run_git("add", "config.py", "debug.log")
        self.engine.run_git("commit", "--amend", "-m", "feat: done")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        # A hard reset discards the half-finished commit instead of rebuilding it.
        self.engine.run_git("reset", "--hard", "HEAD~1")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.run_git("restore", "config.py")
        self.engine.run_git("restore", "--staged", "debug.log")
        self.engine.run_git("reset", "--soft", "HEAD~1")
        self.engine.run_git("commit", "-m", "feat: complete payment feature")
        self.assertTrue((self.engine.workspace / "debug.log").exists())
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_26_merge_strategies(self):
        sc = Scenario26()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        # Fast-forwarding feature/a loses the required merge commit.
        self.engine.run_git("merge", "feature/a")
        self.engine.run_git("merge", "--squash", "feature/b")
        self.engine.run_git("commit", "-m", "feat: implement b")
        self.engine.run_git("branch", "-d", "feature/a")
        self.engine.run_git("branch", "-D", "feature/b")
        self.assertFalse(sc.verify(self.engine)[0])

        # Keeping both feature histories as merge commits is not the required squash.
        sc.setup(self.engine)
        self.engine.run_git("merge", "--no-ff", "feature/a")
        self.engine.run_git("merge", "--no-ff", "feature/b")
        self.engine.run_git("branch", "-d", "feature/a")
        self.engine.run_git("branch", "-d", "feature/b")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.run_git("merge", "--no-ff", "feature/a")
        self.engine.run_git("merge", "--squash", "feature/b")
        self.engine.run_git("commit", "-m", "feat: implement b")
        self.engine.run_git("branch", "-d", "feature/a")
        self.engine.run_git("branch", "-D", "feature/b")
        _, parents, _ = self.engine.run_git("log", "--merges", "-1", "--pretty=%P")
        self.assertEqual(len(parents.strip().split()), 2)
        self.assertIn("# a2", (self.engine.workspace / "mod_a.py").read_text(encoding="utf-8"))
        self.assertIn("# b2", (self.engine.workspace / "mod_b.py").read_text(encoding="utf-8"))
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_27_detached_head_rescue(self):
        sc = Scenario27()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        self.engine.run_git("branch", "hotfix/v1-legacy", "main")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.run_git("switch", "--detach", "v1.0")
        self.engine.create_file("app.py", "print('v1.0 stable')\n# legacy fix\n")
        self.engine.run_git("commit", "-am", "fix: legacy bug on v1.0")
        self.engine.run_git("switch", "main")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.run_git("switch", "--detach", "v1.0")
        self.engine.create_file("app.py", "print('v1.0 stable')\n# legacy fix\n")
        self.engine.run_git("commit", "-am", "fix: legacy bug on v1.0")
        self.engine.run_git("switch", "-c", "hotfix/v1-legacy")
        self.engine.run_git("switch", "main")
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_28_clone_and_track(self):
        sc = Scenario28()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        remote_path = self.engine.repo_dir / ".git-lab-remote-28"
        self.engine.run_git("switch", "-c", "feature/profile")
        self.engine.run_git("push", "-u", "origin", "feature/profile")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        remote_path = self.engine.repo_dir / ".git-lab-remote-28"
        app_dir = self.engine.workspace / "app"
        self.engine.run_git("clone", str(remote_path), str(app_dir))
        self.engine.run_git("-C", str(app_dir), "switch", "-c", "feature/profile")
        # Pushing an unchanged branch creates a remote ref but no feature commit.
        self.engine.run_git("-C", str(app_dir), "push", "-u", "origin", "feature/profile")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        remote_path = self.engine.repo_dir / ".git-lab-remote-28"
        app_dir = self.engine.workspace / "app"
        self.engine.run_git("clone", str(remote_path), str(app_dir))
        self.engine.run_git("-C", str(app_dir), "switch", "-c", "feature/profile")
        self.engine.create_file("app/app.py", "print('App running')\ndef profile(): pass\n")
        self.engine.run_git("-C", str(app_dir), "commit", "-am", "feat: user profile")
        self.engine.run_git("-C", str(app_dir), "push", "origin", "feature/profile")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        remote_path = self.engine.repo_dir / ".git-lab-remote-28"
        app_dir = self.engine.workspace / "app"
        self.engine.run_git("clone", str(remote_path), str(app_dir))
        self.engine.run_git("-C", str(app_dir), "switch", "-c", "feature/profile")
        self.engine.create_file("app/app.py", "print('App running')\ndef profile(): pass\n")
        self.engine.run_git("-C", str(app_dir), "commit", "-am", "feat: user profile")
        self.engine.run_git("-C", str(app_dir), "push", "-u", "origin", "feature/profile")
        _, branches, _ = self.engine.run_git("-C", str(app_dir), "branch", "-vv")
        self.assertIn("[origin/feature/profile]", branches)
        _, remote_app, _ = self.engine.run_git(
            "-C", str(remote_path), "show", "feature/profile:app.py"
        )
        self.assertIn("def profile(): pass", remote_app)
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_29_rebase_conflict_continue(self):
        sc = Scenario29()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        self.engine.run_git("reset", "--hard", "main")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        code, _, _ = self.engine.run_git("rebase", "main", check=False)
        self.assertNotEqual(code, 0)
        _, current_patch, _ = self.engine.run_git("rebase", "--show-current-patch", check=False)
        self.assertIn("feat: feature step 2", current_patch)
        self.assertFalse(sc.verify(self.engine)[0])
        self.engine.run_git("rebase", "--abort")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        code, _, _ = self.engine.run_git("rebase", "main", check=False)
        self.assertNotEqual(code, 0, "The documented rebase must pause for conflict resolution")
        self.engine.create_file(
            "app.py",
            "print('base - main updated')\nprint('base - feature step 2')\n",
        )
        self.engine.run_git("add", "app.py")
        code, out, err = self.engine.run_git("rebase", "--continue", check=False)
        self.assertEqual(code, 0, f"Rebase continuation failed: {err or out}")
        app = (self.engine.workspace / "app.py").read_text(encoding="utf-8")
        self.assertIn("main updated", app)
        self.assertIn("feature step 2", app)
        self.assertTrue((self.engine.workspace / "helper.py").exists())
        self.assertTrue((self.engine.workspace / "feature.py").exists())
        _, feature_commits, _ = self.engine.run_git("rev-list", "--count", "main..feature")
        self.assertEqual(feature_commits.strip(), "3")
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_30_fixup_autosquash(self):
        sc = Scenario30()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        # Correcting only the working tree must not stand in for autosquash.
        self.engine.create_file("validator.py", "def validate(): return True\n")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.create_file("validator.py", "def validate(): return True\n")
        self.engine.run_git("add", "validator.py")
        self.engine.run_git("commit", "-m", "fix: correct validator typo")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.create_file("validator.py", "def validate(): return True\n")
        self.engine.run_git("add", "validator.py")
        _, target, _ = self.engine.run_git(
            "log", "--format=%H", "--grep=feat: add validator helper", "-1"
        )
        self.assertTrue(target.strip())
        self.engine.run_git("commit", "--fixup", target.strip())
        code, out, err = self.engine.run_git("rebase", "-i", "--autosquash", "main", check=False)
        self.assertEqual(code, 0, f"Autosquash rebase failed: {err or out}")
        _, history, _ = self.engine.run_git("log", "main..feature", "--pretty=%s")
        self.assertEqual(len(history.splitlines()), 4)
        self.assertFalse(any("fixup!" in line for line in history.splitlines()))
        self.assertEqual(
            (self.engine.workspace / "validator.py").read_text(encoding="utf-8"),
            "def validate(): return True\n",
        )
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_32_rebase_onto_stacked_pr(self):
        sc = Scenario32()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        code, _, _ = self.engine.run_git("rebase", "main", check=False)
        self.assertNotEqual(code, 0, "Naive rebase should replay the squash-merged API commits and conflict")
        self.engine.run_git("rebase", "--abort")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.run_git("rebase", "--onto", "main", "feature/api", "feature/ui")
        _, commits, _ = self.engine.run_git("log", "main..feature/ui", "--format=%s")
        self.assertEqual(commits.splitlines(), ["feat(ui): forms", "feat(ui): buttons"])
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_35_sparse_checkout(self):
        sc = Scenario35()
        sc.setup(self.engine)
        self.assertFalse(sc.verify(self.engine)[0])

        self.engine.run_git("sparse-checkout", "init", "--cone")
        self.engine.run_git("sparse-checkout", "set", "packages/backend")
        self.assertFalse(sc.verify(self.engine)[0])
        self.assertTrue((self.engine.workspace / "packages/backend/server.js").exists())

        sc.setup(self.engine)
        self.engine.run_git("sparse-checkout", "init", "--cone")
        self.engine.run_git("sparse-checkout", "set", "packages/web")
        self.assertTrue((self.engine.workspace / "packages/web/index.js").exists())
        self.assertFalse((self.engine.workspace / "packages/backend/server.js").exists())
        self.assertFalse((self.engine.workspace / "packages/docs/readme.md").exists())
        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

        sc.setup(self.engine)
        self.engine.run_git("sparse-checkout", "init", "--cone")
        self.engine.run_git("sparse-checkout", "set", "packages/web", "packages/backend")
        self.assertFalse(sc.verify(self.engine)[0])

        sc.setup(self.engine)
        self.engine.run_git("sparse-checkout", "init", "--no-cone")
        self.engine.run_git("sparse-checkout", "set", "packages/web")
        self.assertFalse(sc.verify(self.engine)[0])

    def test_scenario_34_submodule(self):
        sc = Scenario34()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        code, out, err = self.engine.run_git(
            "-c", "protocol.file.allow=always", "submodule", "add",
            "./.git-lab-sub-34", "libs/shared", check=False
        )
        self.assertEqual(code, 0, f"Submodule add failed: {err or out}")

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed, msg)

        code, out, err = self.engine.run_git("commit", "-m", "feat: add shared submodule", check=False)
        self.assertEqual(code, 0, f"Submodule commit failed: {err or out}")

        code, tree_entry, err = self.engine.run_git("ls-tree", "HEAD", "libs/shared", check=False)
        self.assertEqual(code, 0, f"Could not inspect committed submodule: {err}")
        self.assertTrue(tree_entry.startswith("160000 commit "), tree_entry)

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_31_pr_lifecycle(self):
        sc = Scenario31()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        # Deleting the remote feature branch cannot substitute for merging it.
        code, out, err = self.engine.run_git("push", "origin", "--delete", "feature/cart", check=False)
        self.assertEqual(code, 0, f"Remote branch deletion failed: {err or out}")
        self.engine.run_git("switch", "main")
        passed, _ = sc.verify(self.engine)
        self.assertFalse(passed, "Deleting an unmerged PR branch must not pass")

        # Rebuild the fixture and run the documented workflow, including the PR merge command.
        sc.setup(self.engine)
        self.engine.run_git("fetch", "origin")
        code, out, err = self.engine.run_git("rebase", "origin/main", check=False)
        self.assertEqual(code, 0, f"Rebase failed: {err or out}")
        code, out, err = self.engine.run_git("push", "--force-with-lease", "origin", "feature/cart", check=False)
        self.assertEqual(code, 0, f"Safe push failed: {err or out}")

        result = subprocess.run(
            [sys.executable, str(self.engine.project_root / "git-lab"), "pr", "merge", "feature/cart"],
            cwd=self.engine.workspace,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, f"PR merge command failed: {result.stderr or result.stdout}")
        self.assertIn("PR 已模擬合併", result.stdout)

        self.engine.run_git("switch", "main")
        self.engine.run_git("pull", "--ff-only", check=False)
        self.engine.run_git("branch", "-d", "feature/cart")
        self.engine.run_git("fetch", "--prune")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_scenario_33_secret_purge_filter_branch_fallback(self):
        sc = Scenario33()
        sc.setup(self.engine)

        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed)

        remote_path = self.engine.project_root / ".git-lab-remote-33"
        code, remote_log, err = self.engine.run_git(
            "-C", str(remote_path), "log", "--all", "--", ".env", check=False
        )
        self.assertEqual(code, 0, f"Could not inspect initial remote history: {err}")
        self.assertTrue(remote_log.strip(), "Fixture remote must begin with the leaked .env history")

        self.engine.run_git("config", "lab.secret-rotation-confirmed", "yes")
        code, out, err = self.engine.run_git(
            "filter-branch", "--force", "--index-filter",
            "git rm --cached --ignore-unmatch .env", "--prune-empty", "--", "--all", check=False
        )
        self.assertEqual(code, 0, f"filter-branch fallback failed: {err or out}")
        passed, msg = sc.verify(self.engine)
        self.assertFalse(passed, "filter-branch backup refs must keep the scenario blocked")
        self.assertIn("提交歷史中仍找得到 .env", msg)

        code, refs, err = self.engine.run_git(
            "for-each-ref", "--format=%(refname)", "refs/original/", check=False
        )
        self.assertEqual(code, 0, f"Could not inspect backup refs: {err}")
        for ref in refs.splitlines():
            self.engine.run_git("update-ref", "-d", ref)
        self.engine.run_git("reflog", "expire", "--expire=now", "--all")
        self.engine.run_git("gc", "--prune=now")

        (self.engine.workspace / ".gitignore").write_text(".env\n", encoding="utf-8")
        self.engine.run_git("add", ".gitignore")
        self.engine.run_git("commit", "-m", "chore: ignore .env")

        code, _, _ = self.engine.run_git("remote", "get-url", "origin", check=False)
        if code != 0:
            code, origin_url, err = self.engine.run_git(
                "config", "--get", "lab.secret-purge-remote-url", check=False
            )
            self.assertEqual(code, 0, f"Could not restore origin URL: {err}")
            self.engine.run_git("remote", "add", "origin", origin_url.strip())

        code, expected_remote, err = self.engine.run_git(
            "config", "--get", "lab.secret-purge-remote-main", check=False
        )
        self.assertEqual(code, 0, f"Missing expected remote lease: {err}")

        code, out, err = self.engine.run_git(
            "push", f"--force-with-lease=refs/heads/main:{expected_remote.strip()}",
            "origin", "main", check=False
        )
        self.assertEqual(code, 0, f"Lease-protected history push failed: {err or out}")
        code, remote_log, err = self.engine.run_git(
            "-C", str(remote_path), "log", "--all", "--", ".env", check=False
        )
        self.assertEqual(code, 0, f"Could not inspect rewritten remote history: {err}")
        self.assertFalse(remote_log.strip(), "Remote refs must no longer reach .env history")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    @unittest.skipUnless(shutil.which("git-filter-repo"), "git-filter-repo is optional")
    def test_scenario_33_secret_purge_filter_repo(self):
        sc = Scenario33()
        sc.setup(self.engine)
        self.assertFalse((self.engine.workspace / "git-lab").exists())
        self.engine.run_git("config", "lab.secret-rotation-confirmed", "yes")

        code, out, err = self.engine.run_git(
            "filter-repo", "--path", ".env", "--invert-paths", check=False
        )
        self.assertEqual(code, 0, f"git-filter-repo failed: {err or out}")

        code, origin_url, err = self.engine.run_git(
            "config", "--get", "lab.secret-purge-remote-url", check=False
        )
        self.assertEqual(code, 0, f"Missing saved remote URL: {err}")
        code, _, _ = self.engine.run_git("remote", "get-url", "origin", check=False)
        if code != 0:
            self.engine.run_git("remote", "add", "origin", origin_url.strip())

        (self.engine.workspace / ".gitignore").write_text(".env\n", encoding="utf-8")
        self.engine.run_git("add", ".gitignore")
        self.engine.run_git("commit", "-m", "chore: ignore .env")
        code, expected_remote, err = self.engine.run_git(
            "config", "--get", "lab.secret-purge-remote-main", check=False
        )
        self.assertEqual(code, 0, f"Missing saved remote lease: {err}")
        code, out, err = self.engine.run_git(
            "push", f"--force-with-lease=refs/heads/main:{expected_remote.strip()}",
            "origin", "main", check=False
        )
        self.assertEqual(code, 0, f"Lease-protected history push failed: {err or out}")

        passed, msg = sc.verify(self.engine)
        self.assertTrue(passed, msg)

    def test_curriculum_consistency(self):
        import re
        from lab.curriculum import get_curriculum
        from lab.scenarios import SCENARIO_MAP

        # 1. Manifest IDs
        curr = get_curriculum()
        manifest_ids = set()
        for ch in curr.get("chapters", []):
            for lvl in ch.get("levels", []):
                manifest_ids.add(lvl["id"])
        for opt in curr.get("optional", []):
            manifest_ids.add(opt["id"])

        # 2. Python Scenario Map IDs
        python_ids = set(SCENARIO_MAP.keys())

        # 3. JavaScript Scenarios IDs from scenarios-data.js and scenarios-extra.js
        js_ids = set()
        id_pattern = re.compile(r"id:\s*['\"]([0-9]{2})['\"]")
        for fn in ["scenarios-data.js", "scenarios-extra.js"]:
            p = REPO_ROOT / "docs" / fn
            if p.exists():
                matches = id_pattern.findall(p.read_text(encoding="utf-8"))
                js_ids.update(matches)

        self.assertEqual(manifest_ids, python_ids, f"Manifest IDs != Python IDs: {manifest_ids ^ python_ids}")
        self.assertEqual(manifest_ids, js_ids, f"Manifest IDs != JS IDs: {manifest_ids ^ js_ids}")

if __name__ == "__main__":
    unittest.main()

