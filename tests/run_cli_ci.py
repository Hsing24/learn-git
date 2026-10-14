"""Run every CLI acceptance test; missing elective coverage fails CI."""

import sys
import unittest
from pathlib import Path

tests_dir = Path(__file__).resolve().parent
suite = unittest.defaultTestLoader.discover(str(tests_dir), pattern="test_all_scenarios.py")
result = unittest.TextTestRunner(verbosity=2).run(suite)
if result.skipped:
    print("CI requires all elective tools; skipped tests are a failure.", file=sys.stderr)
sys.exit(0 if result.wasSuccessful() and result.testsRun > 0 and not result.skipped else 1)
