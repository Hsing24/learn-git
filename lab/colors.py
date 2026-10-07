"""ANSI Color definitions and formatting utilities for Git Lab."""

import os
import sys

# Detect if colors should be enabled
ENABLE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None

class Colors:
    RESET = "\033[0m" if ENABLE_COLOR else ""
    BOLD = "\033[1m" if ENABLE_COLOR else ""
    DIM = "\033[2m" if ENABLE_COLOR else ""
    ITALIC = "\033[3m" if ENABLE_COLOR else ""
    UNDERLINE = "\033[4m" if ENABLE_COLOR else ""

    RED = "\033[31m" if ENABLE_COLOR else ""
    GREEN = "\033[32m" if ENABLE_COLOR else ""
    YELLOW = "\033[33m" if ENABLE_COLOR else ""
    BLUE = "\033[34m" if ENABLE_COLOR else ""
    MAGENTA = "\033[35m" if ENABLE_COLOR else ""
    CYAN = "\033[36m" if ENABLE_COLOR else ""
    WHITE = "\033[37m" if ENABLE_COLOR else ""

    BG_BLUE = "\033[44m" if ENABLE_COLOR else ""
    BG_GREEN = "\033[42m" if ENABLE_COLOR else ""
    BG_RED = "\033[41m" if ENABLE_COLOR else ""

def bold(text: str) -> str:
    return f"{Colors.BOLD}{text}{Colors.RESET}"

def green(text: str) -> str:
    return f"{Colors.GREEN}{text}{Colors.RESET}"

def red(text: str) -> str:
    return f"{Colors.RED}{text}{Colors.RESET}"

def yellow(text: str) -> str:
    return f"{Colors.YELLOW}{text}{Colors.RESET}"

def cyan(text: str) -> str:
    return f"{Colors.CYAN}{text}{Colors.RESET}"

def blue(text: str) -> str:
    return f"{Colors.BLUE}{text}{Colors.RESET}"

def magenta(text: str) -> str:
    return f"{Colors.MAGENTA}{text}{Colors.RESET}"

def dim(text: str) -> str:
    return f"{Colors.DIM}{text}{Colors.RESET}"
