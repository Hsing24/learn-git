"""Visual layout helpers, boxes, and cards for Git Lab."""

import shutil
from typing import List, Tuple
from lab.colors import bold, green, red, yellow, cyan, blue, magenta, dim

def get_terminal_width(default: int = 80) -> int:
    try:
        width = shutil.get_terminal_size((default, 24)).columns
        return max(60, min(width, 100))
    except Exception:
        return default

def print_banner():
    banner = f"""
{cyan("╔══════════════════════════════════════════════════════════════════════╗")}
{cyan("║")}     {bold(yellow("🚀 Git Scenario Lab"))} {dim("— 專為單人打造的終端機實戰情境實驗室")}       {cyan("║")}
{cyan("╚══════════════════════════════════════════════════════════════════════╝")}
"""
    print(banner.strip())

def print_card(title: str, lines: List[str], border_color=cyan):
    width = get_terminal_width()
    inner_width = width - 4
    
    print(border_color(f"╭─ {bold(title)} " + "─" * max(0, width - len(title) - 6) + "╮"))
    for line in lines:
        print(f"{border_color('│')} {line}")
    print(border_color("╰" + "─" * (width - 2) + "╯"))

def print_scenario_briefing(sc_id: str, title: str, difficulty: str, story: str, goals: List[str], next_steps: List[str]):
    width = get_terminal_width()
    print()
    print(cyan(f"╭── 關卡 {bold(sc_id)}: {bold(title)} ── [{yellow(difficulty)}] " + "─" * max(0, width - len(sc_id) - len(title) - len(difficulty) - 20) + "╮"))
    
    print(f"{cyan('│')} {bold('📖 背景情境 (Story):')}")
    for s_line in story.strip().split("\n"):
        print(f"{cyan('│')}   {dim(s_line.strip())}")
    
    print(cyan('│'))
    print(f"{cyan('│')} {bold('🎯 任務目標 (Goals):')}")
    for i, g in enumerate(goals, 1):
        print(f"{cyan('│')}   {yellow(f'{i}.')} {g}")
    
    if next_steps:
        print(cyan('│'))
        print(f"{cyan('│')} {bold('💡 下一步探索指引 (Next Steps):')}")
        for step in next_steps:
            print(f"{cyan('│')}   {green('➜')} {step}")
            
    print(cyan("╰" + "─" * (width - 2) + "╯"))
    print()

def print_success_card(title: str, message: str, next_cmd: str = None):
    lines = [
        f"  {green(bold('🎉 太棒了！任務成功通關！'))}",
        f"  {message}",
    ]
    if next_cmd:
        lines.append("")
        lines.append(f"  {cyan('繼續挑戰下一關：')} {yellow(bold(next_cmd))}")
    print_card(f"通關驗證 — {title}", lines, border_color=green)

def print_fail_card(title: str, reason: str, hint_cmd: str = "./git-lab hint"):
    lines = [
        f"  {red(bold('❌ 尚未達成目標，請再檢查一下：'))}",
        f"  {reason}",
        "",
        f"  {dim('卡關了嗎？可以使用')} {yellow(bold(hint_cmd))} {dim('獲取逐步提示，或')} {yellow(bold('./git-lab reset'))} {dim('重來。')}"
    ]
    print_card(f"驗證未通過 — {title}", lines, border_color=red)

def print_scenarios_table(scenarios_info: List[dict]):
    print_banner()
    print(f"\n{bold('📚 關卡清單 (Scenario List):')}\n")
    header = f"  {'ID':<6} {'難度':<10} {'狀態':<10} {'關卡名稱與重點'}"
    print(header)
    print("  " + "─" * (get_terminal_width() - 4))
    
    for sc in scenarios_info:
        sc_id = sc['id']
        diff = sc['difficulty']
        status = sc['status']
        title = sc['title']
        
        if status == "PASSED":
            status_str = green("✔ 已通關")
        elif status == "ACTIVE":
            status_str = yellow("▶ 進行中")
        else:
            status_str = dim("○ 未開始")
            
        print(f"  {bold(sc_id):<15} {diff:<14} {status_str:<19} {title}")
        
    print("\n" + dim("  使用指令：") + yellow("./git-lab start <ID>") + dim(" 啟動關卡，例如：") + yellow("./git-lab start 03") + "\n")
