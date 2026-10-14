# Repository Guidelines

## Language and Terminology

Write Chinese in Traditional Chinese using Taiwan usage. Keep Git terms in English, including `commit`, `branch`, `merge`, `rebase`, `cherry-pick`, `stage`, `stash`, `remote`, `push`, `tag`, and `pull request`. Follow [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md) when editing Markdown, Web scripts, CLI code, or lessons.

## Project Structure & Module Organization

This project pairs a Python CLI with a static JavaScript simulator. `git-lab` is the CLI entry point; `lab/` holds its engine and lessons. `docs/` contains the deployable site and guides. `tests/` contains Python, Node.js, and browser tests plus fixtures. `plan/CURRICULUM_PLAN.md` describes the curriculum. See `CONTRIBUTING.md` for workflows and `DESIGN.md` for UI rules. Keep generated `workspace/`, mock remotes, and state files untracked.

## Build, Test, and Development Commands

Use Python 3.11+, Git 2.28+, and Node.js 24+. No site build step is needed.

- `python3 -m http.server 8000 --directory docs`: serve the site locally.
- `./git-lab list`; `./git-lab start 00`: list lessons or start a CLI exercise.
- `python3 tests/test_all_scenarios.py`: run CLI and curriculum acceptance tests.
- `npm run test:web`: run Web simulator acceptance tests.
- `npm ci`, then `npx playwright install chromium`: install browser dependencies.
- `npm run test:browser`: run desktop/mobile Chromium tests; Playwright starts the server.
- `git diff --check`: check patch whitespace.

## Coding Style & Naming Conventions

Follow existing style: four-space Python and two-space JavaScript/CSS indentation; Python `snake_case`, JavaScript `camelCase`, and `PascalCase` classes. Name lessons like `s01_basics.py` and `Scenario01`. No formatter or linter is configured; check JavaScript with `node --check <file>`.

## Testing Guidelines

Use Python `unittest` (`test_*.py`, `test_*` methods), Node.js assertions, and Playwright (`*.spec.mjs`). Lesson tests should reject initial states and destructive shortcuts, accept intended solutions, and verify contents, refs, or history. No coverage threshold is set. CI's `python3 tests/run_cli_ci.py` rejects skipped tests; install `git-lfs`, `git-filter-repo`, and SSH signing tools for full coverage.

## Curriculum and Interface Changes

Preserve lesson IDs and keep `docs/curriculum.js` parseable as JSON by Python. Update CLI/Web lessons, guides, manifest, and tests together; mark CLI-only electives. Explain protected-text changes and update their fixture. When editing JavaScript, update the cache version in `docs/index.html`.

## Commit & Pull Request Guidelines

History uses prefixes such as `feat:`, `fix:`, `docs:`, `test:`, and `ci:`. Keep PRs focused; use `.github/pull_request_template.md`, describe behavior, link issues, and report validation. Include screenshots and viewport sizes for UI changes; provide 2–3 manual cases for new engine commands. Required CI checks must pass before merging.
