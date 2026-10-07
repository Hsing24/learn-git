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

if __name__ == "__main__":
    unittest.main()
