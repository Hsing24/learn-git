"""Acceptance and shortcut rejection for the added core and optional CLI labs."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))
from lab.engine import GitEngine
from lab.scenarios import SCENARIO_MAP
from lab.scenarios.expanded import output, recalled


class TestCurriculumExpansion(unittest.TestCase):
    def setUp(self):
        self.saved_git_env = {k: v for k, v in os.environ.items() if k.startswith("GIT_")}
        for key in self.saved_git_env:
            os.environ.pop(key, None)
        self.project = tempfile.TemporaryDirectory(prefix="learn-git-expansion-")
        self.root = Path(self.project.name)
        shutil.copy2(REPO_ROOT / "git-lab", self.root / "git-lab")
        shutil.copytree(REPO_ROOT / "lab", self.root / "lab")
        (self.root / "docs").mkdir()
        shutil.copy2(REPO_ROOT / "docs/curriculum.js", self.root / "docs/curriculum.js")
        config = self.root / "global-config"
        config.write_text("")
        os.environ.update({"GIT_CONFIG_GLOBAL": str(config), "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_AUTHOR_NAME": "Learner", "GIT_AUTHOR_EMAIL": "learner@example.com",
            "GIT_COMMITTER_NAME": "Learner", "GIT_COMMITTER_EMAIL": "learner@example.com",
            "GIT_EDITOR": "true", "GIT_SEQUENCE_EDITOR": "true"})
        self.e = GitEngine(self.root)
        self.e.init_repo_if_needed()

    def tearDown(self):
        for key in list(os.environ):
            if key.startswith("GIT_"):
                os.environ.pop(key, None)
        os.environ.update(self.saved_git_env)
        self.project.cleanup()

    def start(self, sid):
        self.sc = SCENARIO_MAP[sid]
        self.sc.setup(self.e)
        self.assertFalse(self.sc.verify(self.e)[0], f"{sid} must not pass its fixture")
        return self.sc

    def passed(self):
        ok, msg = self.sc.verify(self.e)
        self.assertTrue(ok, msg)

    def test_legacy_shortcuts_require_topology_and_committed_content(self):
        self.start("02")
        self.e.commit_file("discount.py", "def discount(total): return total * 0.9\n", "direct main shortcut")
        self.assertFalse(self.sc.verify(self.e)[0], "branch workflow cannot be replaced by direct main commit")
        self.start("04")
        self.e.run_git("merge", "main", "--no-edit")
        self.assertFalse(self.sc.verify(self.e)[0], "a merge is not the requested linear rebase")
        self.start("05")
        self.e.run_git("reset", "--soft", "HEAD~3")
        self.e.run_git("restore", "--staged", "auth.py")
        self.e.run_git("commit", "--allow-empty", "-m", "feat: implement user authentication")
        self.assertFalse(self.sc.verify(self.e)[0], "working-tree auth and correct subject are insufficient")
        self.start("06")
        self.e.create_file("notice.txt", "公告：系統將於今晚維護更新。\n")
        self.e.run_git("push", "--force", "origin", "main")
        self.assertFalse(self.sc.verify(self.e)[0], "force overwrite plus untracked peer file must fail")
        self.start("21")
        self.e.run_git("remote", "add", "upstream", (self.e.read_file("upstream_path.txt") or "").strip())
        self.e.commit_file("security.py", "fake\n", "fix: critical security patch from upstream")
        self.assertFalse(self.sc.verify(self.e)[0], "same subject cannot stand in for actual upstream commit")

    def test_36_uninitialized_cli_and_initial_commit(self):
        self.start("36")
        self.e.set_active_scenario("36")
        process = subprocess.run([sys.executable, str(self.root / "git-lab"), "verify"], cwd=self.e.workspace, capture_output=True, text=True)
        self.assertEqual(process.returncode, 0)
        self.assertFalse((self.e.workspace / ".git").exists(), "verify must not silently initialize level 36")
        self.e.run_git("init", "-b", "main")
        self.e.run_git("config", "user.name", "Learner")
        self.e.run_git("config", "user.email", "learner@example.com")
        self.e.run_git("add", "README.md")
        self.e.run_git("commit", "-m", "initialize")
        self.passed()

    def test_37_index_snapshot_rejects_commit_a(self):
        self.start("37")
        self.e.create_file("note.txt", "version 2\n")
        self.e.run_git("add", "note.txt")
        self.e.create_file("note.txt", "version 3\n")
        self.e.run_git("commit", "-am", "incorrectly include working tree")
        self.assertFalse(self.sc.verify(self.e)[0])
        self.start("37")
        self.e.create_file("note.txt", "version 2\n")
        self.e.run_git("add", "note.txt")
        self.e.create_file("note.txt", "version 3\n")
        self.e.run_git("commit", "-m", "reviewed staged version")
        self.passed()

    def test_38_revert_rejects_reset_and_working_tree_only(self):
        self.start("38")
        self.e.run_git("reset", "--hard", "HEAD^")
        self.assertFalse(self.sc.verify(self.e)[0])
        self.start("38")
        self.e.create_file("config.txt", "mode=safe\n")
        self.assertFalse(self.sc.verify(self.e)[0])
        self.e.run_git("restore", "config.txt")
        self.e.run_git("revert", "HEAD", "--no-edit")
        self.passed()

    def test_39_ff_only_divergence_merge_and_rebase(self):
        for strategy in ("merge", "rebase"):
            with self.subTest(strategy=strategy):
                self.start("39")
                original = self.e.get_head_hash()
                self.e.run_git("fetch", "origin")
                code, _, _ = self.e.run_git("merge", "--ff-only", "origin/main", check=False)
                self.assertNotEqual(code, 0)
                self.assertEqual(self.e.get_head_hash(), original)
                self.e.run_git(strategy, "origin/main", *(["--no-edit"] if strategy == "merge" else []))
                self.assertFalse(self.sc.verify(self.e)[0], "integration must be pushed")
                self.e.run_git("push", "origin", "main")
                self.passed()

    def test_40_offline_authentication_diagnostics(self):
        self.start("40")
        self.e.run_git("config", "user.email", "correct@example.com")
        self.assertFalse(self.sc.verify(self.e)[0])
        self.e.create_file("diagnosis.json", json.dumps({"case1": "authentication", "case2": "url", "case3": "permission", "case4": "author"}))
        self.passed()

    def test_41_directory_negation_and_check_ignore(self):
        self.start("41")
        self.e.create_file(".gitignore", "*.log\nbuild/\ndata/\n!data/keep.csv\n")
        self.assertEqual(self.e.run_git("check-ignore", "-q", "data/keep.csv", check=False)[0], 0)
        self.assertFalse(self.sc.verify(self.e)[0])
        self.e.create_file(".gitignore", "*.log\nbuild/\ndata/*\n!data/keep.csv\n")
        _, verbose, _ = self.e.run_git("check-ignore", "-v", "trace.log", "build/output.bin", "data/drop.csv")
        self.assertIn(".gitignore:1:*.log", verbose)
        self.e.run_git("add", ".gitignore", "data/keep.csv")
        self.assertFalse(self.sc.verify(self.e)[0], "index alone does not satisfy committed rules")
        self.e.run_git("commit", "-m", "ignore generated files")
        self.passed()

    def test_42_attributes_normalize_blob(self):
        self.start("42")
        self.e.create_file(".gitattributes", "*.txt text eol=lf\n")
        self.e.run_git("add", ".gitattributes")
        self.e.run_git("commit", "-m", "attributes without renormalization")
        self.assertFalse(self.sc.verify(self.e)[0])
        self.e.run_git("reset", "--soft", "HEAD^")
        self.e.run_git("add", "--renormalize", ".")
        self.e.run_git("commit", "-m", "normalize line endings")
        self.passed()

    def test_43_rebase_edit_split_and_range_diff(self):
        self.start("43")
        editor = self.root / "edit-sequence.py"
        editor.write_text("import pathlib,sys\np=pathlib.Path(sys.argv[1]);p.write_text(p.read_text().replace('pick ', 'edit ', 1))\n")
        self.e.run_git("rebase", "-i", "HEAD~1", env={"GIT_SEQUENCE_EDITOR": f"{sys.executable} {editor}"})
        self.assertFalse(self.sc.verify(self.e)[0])
        self.e.run_git("reset", "HEAD^")
        self.e.run_git("add", "alpha.py")
        self.e.run_git("commit", "-m", "alpha")
        self.e.run_git("add", "beta.py")
        self.e.run_git("commit", "-m", "beta")
        self.assertFalse(self.sc.verify(self.e)[0], "rebase must finish")
        self.e.run_git("rebase", "--continue")
        _, diff, _ = self.e.run_git("range-diff", "main..old-series", "main..feature")
        self.assertIn("alpha", diff)
        self.passed()

    def test_44_parent_selectors_and_range_sets(self):
        self.start("44")
        self.assertNotEqual(output(self.e, "rev-parse", "HEAD^"), output(self.e, "rev-parse", "HEAD^2"))
        answers = {key: output(self.e, "rev-parse", ref) for key, ref in (("parent", "HEAD^"), ("ancestor", "HEAD~2"), ("secondParent", "HEAD^2"))}
        answers.update({"twoDot": output(self.e, "rev-list", "A..B").splitlines(), "threeDot": output(self.e, "rev-list", "A...B").splitlines()})
        self.assertEqual(len(answers["twoDot"]), 1)
        self.assertEqual(len(answers["threeDot"]), 2)
        self.e.create_file("ranges.json", json.dumps(answers))
        self.passed()
        answers["threeDot"] = answers["twoDot"]
        self.e.create_file("ranges.json", json.dumps(answers))
        self.assertFalse(self.sc.verify(self.e)[0])

    def test_45_bisect_run_exit_codes_and_finished_workflow(self):
        self.start("45")
        # 127 is interpreted as bad, demonstrating why absent commands need preflight.
        self.e.run_git("bisect", "start", "HEAD", "good")
        code, _, _ = self.e.run_git("bisect", "run", "sh", "-c", "exit 127", check=False)
        # Recent Git verifies suspicious 126/127 on a known-good commit and aborts.
        # Older implementations may classify them as bad; either demonstrates tool failure.
        self.assertNotEqual(self.e.get_head_hash(), recalled(self.e, "45", "bad"))
        self.e.run_git("bisect", "reset")
        self.e.create_file("check-skip.py", "import runpy,sys\ns=open('calc.py').read()\nsys.exit(125 if '# step 4' in s else (0 if runpy.run_path('calc.py')['RESULT']==4 else 1))\n")
        self.e.run_git("bisect", "start", "HEAD", "good")
        code, out, err = self.e.run_git("bisect", "run", sys.executable, "check-skip.py", check=False)
        self.assertEqual(code, 0, err or out)
        self.e.create_file("culprit.txt", self.e.get_head_hash())
        self.assertFalse(self.sc.verify(self.e)[0], "still in bisect must fail")
        self.e.run_git("bisect", "reset")
        self.passed()

    def test_46_partial_and_shallow_local_server(self):
        self.start("46")
        url = (self.e.workspace / ".git-lab-server.git").as_uri()
        self.e.run_git("clone", "--filter=blob:none", "--no-checkout", url, "partial")
        self.e.run_git("clone", "--depth=1", url, "shallow")
        self.assertEqual(output(self.e, "rev-parse", "--is-shallow-repository", cwd=self.e.workspace / "shallow"), "true")
        run_git = self.e.run_git
        def git_228(*args, **kwargs):
            if args and args[0] == "ls-tree" and any(arg.startswith("--format") for arg in args):
                return 129, "", "error: unknown option `format'"
            return run_git(*args, **kwargs)
        # A Git 2.28 style command surface must support both verification phases.
        with patch.object(self.e, "run_git", side_effect=git_228):
            self.assertFalse(self.sc.verify(self.e)[0])
            self.assertTrue(recalled(self.e, "46", "boundary"))
            self.e.run_git("fetch", "--unshallow", cwd=self.e.workspace / "shallow")
            self.passed()

    def test_committed_ignore_and_attributes_policy_rejects_local_only_rules(self):
        self.start("41")
        self.e.create_file(".gitignore", "# no committed ignores\n")
        self.e.run_git("add", ".gitignore", "data/keep.csv")
        self.e.run_git("commit", "-m", "missing ignore policy")
        self.e.create_file(".gitignore", "*.log\nbuild/\ndata/*\n!data/keep.csv\n")
        self.assertFalse(self.sc.verify(self.e)[0], "working-tree policy must be committed")
        self.e.run_git("add", ".gitignore")
        self.assertFalse(self.sc.verify(self.e)[0], "staged policy must be committed")
        self.start("42")
        self.e.create_file(".gitattributes", "# no committed attributes\n")
        self.e.create_file("lines.txt", "one\ntwo\n")
        self.e.run_git("add", ".gitattributes", "lines.txt")
        self.e.run_git("commit", "-m", "normalized content without policy")
        self.e.create_file(".gitattributes", "*.txt text eol=lf\n")
        self.e.run_git("add", ".gitattributes")
        self.assertFalse(self.sc.verify(self.e)[0], "cached attributes are insufficient without committed policy")

    def test_44_malformed_answers_report_failure_without_crashing(self):
        self.start("44")
        malformed = [[], "string", None, {}, {"parent": []},
            {"parent": "0" * 40, "ancestor": "0" * 40, "secondParent": "0" * 40,
             "twoDot": [{}], "threeDot": ["0" * 40]},
            {"parent": "0" * 40, "ancestor": "0" * 40, "secondParent": "0" * 40,
             "twoDot": ["0" * 40, "0" * 40], "threeDot": "0" * 40}]
        for answer in malformed:
            with self.subTest(answer=answer):
                self.e.create_file("ranges.json", json.dumps(answer))
                self.assertFalse(self.sc.verify(self.e)[0])

    def test_46_rejects_full_clones_fake_filter_and_uncaptured_boundary(self):
        self.start("46")
        url = (self.e.workspace / ".git-lab-server.git").as_uri()
        self.e.run_git("clone", "--no-checkout", url, "partial")
        self.e.run_git("config", "remote.origin.promisor", "true", cwd=self.e.workspace / "partial")
        self.e.run_git("config", "remote.origin.partialclonefilter", "blob:none", cwd=self.e.workspace / "partial")
        self.e.run_git("clone", url, "shallow")
        self.assertFalse(self.sc.verify(self.e)[0], "full clone cannot pretend to be partial via config")
        shutil.rmtree(self.e.workspace / "partial")
        self.e.run_git("clone", "--filter=blob:none", "--no-checkout", url, "partial")
        self.assertFalse(self.sc.verify(self.e)[0], "full clone cannot substitute for a captured shallow boundary")
        self.assertFalse(recalled(self.e, "46", "boundary"))
        shutil.rmtree(self.e.workspace / "shallow")
        self.e.run_git("clone", "--depth=1", url, "shallow")
        self.e.run_git("fetch", "--unshallow", cwd=self.e.workspace / "shallow")
        self.assertFalse(self.sc.verify(self.e)[0], "unshallow before checkpoint has no shallow evidence")

    def test_47_optional_lfs_pointer(self):
        if self.e.run_git("lfs", "version", check=False)[0] != 0:
            with self.assertRaisesRegex(RuntimeError, "git-lfs"):
                SCENARIO_MAP["47"].setup(self.e)
            self.skipTest("git-lfs is not installed")
        self.start("47")
        self.e.run_git("lfs", "install", "--local")
        self.e.run_git("lfs", "track", "*.bin")
        self.e.run_git("add", ".gitattributes", "asset.bin")
        self.e.run_git("commit", "-m", "track binary with LFS")
        self.passed()

    def test_48_optional_ssh_signed_commit_and_tag(self):
        try:
            self.start("48")
        except RuntimeError as exc:
            if "前置條件" in str(exc):
                self.skipTest(str(exc))
            raise
        key = self.e.workspace / ".git/lab-signing-key"
        subprocess.run(["ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-f", str(key)], check=True, capture_output=True)
        allowed = self.e.workspace / ".git/allowed_signers"
        allowed.write_text("learner@example.com " + key.with_suffix(".pub").read_text())
        self.e.run_git("config", "gpg.format", "ssh")
        self.e.run_git("config", "user.signingkey", str(key))
        self.e.run_git("config", "gpg.ssh.allowedSignersFile", str(allowed))
        self.e.run_git("add", "signed.txt")
        self.e.run_git("commit", "-S", "-m", "signed change")
        self.e.run_git("tag", "-a", "signed-v1", "-m", "unsigned annotated tag")
        self.assertFalse(self.sc.verify(self.e)[0])
        self.e.run_git("tag", "-d", "signed-v1")
        self.e.run_git("tag", "-s", "signed-v1", "-m", "signed release")
        self.passed()
        allowed.write_text("other@example.com " + key.with_suffix(".pub").read_text())
        self.assertFalse(self.sc.verify(self.e)[0], "untrusted signer must fail")


if __name__ == "__main__":
    unittest.main()
