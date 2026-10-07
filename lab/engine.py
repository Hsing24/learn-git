"""Git execution engine, sandbox management, and state tracking."""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any

class GitEngine:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.workspace_dir = project_root / "workspace"
        self.repo_dir = self.workspace_dir
        self.state_file = project_root / ".git-lab-state.json"

    @property
    def workspace(self) -> Path:
        """Alias for workspace_dir."""
        return self.workspace_dir

    def _ensure_workspace_symlink(self):
        """Create symlink in workspace so user can run ./git-lab inside workspace."""
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        link = self.workspace_dir / "git-lab"
        target = self.project_root / "git-lab"
        if not link.exists():
            try:
                # Use relative symlink
                os.symlink("../git-lab", str(link))
            except Exception:
                pass

    def run_git(self, *args: str, check: bool = True, capture: bool = True, cwd: Optional[Path] = None, env: Optional[Dict[str, str]] = None) -> Tuple[int, str, str]:
        """Run a git command in the repository."""
        work_dir = str(cwd or self.repo_dir)
        cmd = ["git"] + list(args)
        merged_env = os.environ.copy()
        merged_env.setdefault("GIT_AUTHOR_NAME", "Student")
        merged_env.setdefault("GIT_AUTHOR_EMAIL", "student@learn-git.local")
        merged_env.setdefault("GIT_COMMITTER_NAME", "Student")
        merged_env.setdefault("GIT_COMMITTER_EMAIL", "student@learn-git.local")
        if env:
            merged_env.update(env)

        try:
            res = subprocess.run(
                cmd,
                cwd=work_dir,
                capture_output=capture,
                text=True,
                check=False,
                env=merged_env
            )
            if check and res.returncode != 0:
                raise subprocess.CalledProcessError(
                    res.returncode, cmd, output=res.stdout, stderr=res.stderr
                )
            return res.returncode, res.stdout or "", res.stderr or ""
        except FileNotFoundError:
            raise RuntimeError("系統未安裝 Git，請先確認已安裝 Git 命令列工具。")

    def init_repo_if_needed(self):
        """Initialize git repo in workspace if not exists."""
        self._ensure_workspace_symlink()
        if not (self.repo_dir / ".git").exists():
            self.run_git("init", "-b", "main")

    def get_state(self) -> Dict[str, Any]:
        """Load persistent lab state."""
        default_state = {
            "active_scenario": None,
            "completed_scenarios": [],
            "hint_counts": {}
        }
        if not self.state_file.exists():
            return default_state
        try:
            with open(self.state_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_state

    def save_state(self, state: Dict[str, Any]):
        """Save persistent lab state."""
        with open(self.state_file, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)

    def mark_scenario_passed(self, sc_id: str):
        state = self.get_state()
        completed = set(state.get("completed_scenarios", []))
        completed.add(sc_id)
        state["completed_scenarios"] = sorted(list(completed))
        self.save_state(state)

    def set_active_scenario(self, sc_id: Optional[str]):
        state = self.get_state()
        state["active_scenario"] = sc_id
        if sc_id and sc_id not in state.get("hint_counts", {}):
            state.setdefault("hint_counts", {})[sc_id] = 0
        self.save_state(state)

    def get_hint_count(self, sc_id: str) -> int:
        state = self.get_state()
        return state.get("hint_counts", {}).get(sc_id, 0)

    def increment_hint_count(self, sc_id: str) -> int:
        state = self.get_state()
        counts = state.setdefault("hint_counts", {})
        counts[sc_id] = counts.get(sc_id, 0) + 1
        self.save_state(state)
        return counts[sc_id]

    def abort_in_progress_operations(self):
        """Abort any ongoing merge, rebase, or cherry-pick in workspace."""
        if not (self.repo_dir / ".git").exists():
            return

        # Abort merge
        if (self.repo_dir / ".git" / "MERGE_HEAD").exists():
            self.run_git("merge", "--abort", check=False)

        # Abort rebase
        if (self.repo_dir / ".git" / "rebase-merge").exists() or (self.repo_dir / ".git" / "rebase-apply").exists():
            self.run_git("rebase", "--abort", check=False)

        # Abort cherry-pick
        if (self.repo_dir / ".git" / "CHERRY_PICK_HEAD").exists():
            self.run_git("cherry-pick", "--abort", check=False)

    def clean_workspace(self):
        """Completely clean workspace directory and re-initialize a pure baseline git repository."""
        self.abort_in_progress_operations()
        
        # Remove any mock remote
        mock_remote = self.project_root / ".git-lab-remote"
        if mock_remote.exists():
            shutil.rmtree(mock_remote, ignore_errors=True)

        # Remove extra worktrees if any outside workspace
        hotfix_wt = self.project_root / "hotfix-rescue"
        if hotfix_wt.exists():
            shutil.rmtree(hotfix_wt, ignore_errors=True)

        if self.workspace_dir.exists():
            shutil.rmtree(self.workspace_dir, ignore_errors=True)

        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        self._ensure_workspace_symlink()

        # Init fresh git repo in workspace
        self.run_git("init", "-b", "main")

    def create_file(self, relative_path: str, content: str):
        """Create or overwrite a file in workspace."""
        target = self.repo_dir / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            f.write(content)

    def read_file(self, relative_path: str) -> Optional[str]:
        """Read content of a file in workspace."""
        target = self.repo_dir / relative_path
        if not target.exists():
            return None
        with open(target, "r", encoding="utf-8") as f:
            return f.read()

    def file_exists(self, relative_path: str) -> bool:
        return (self.repo_dir / relative_path).exists()

    def get_current_branch(self) -> Optional[str]:
        code, out, _ = self.run_git("branch", "--show-current", check=False)
        if code == 0 and out.strip():
            return out.strip()
        code, out, _ = self.run_git("rev-parse", "--abbrev-ref", "HEAD", check=False)
        return out.strip() if code == 0 else None

    def commit_file(self, filename: str, content: str, message: str, author_name: str = "Student", author_email: str = "student@learn-git.local"):
        """Convenience method to write a file, stage it, and commit it."""
        self.create_file(filename, content)
        self.run_git("add", filename)
        env = {
            "GIT_AUTHOR_NAME": author_name,
            "GIT_AUTHOR_EMAIL": author_email,
            "GIT_COMMITTER_NAME": author_name,
            "GIT_COMMITTER_EMAIL": author_email,
        }
        self.run_git("commit", "-m", message, env=env)

    def get_commit_count(self) -> int:
        code, out, _ = self.run_git("rev-list", "--count", "HEAD", check=False)
        if code == 0 and out.strip().isdigit():
            return int(out.strip())
        return 0

    def get_head_hash(self) -> Optional[str]:
        code, out, _ = self.run_git("rev-parse", "HEAD", check=False)
        return out.strip() if code == 0 else None
