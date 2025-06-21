import argparse
import re
from pathlib import Path
from typing import List

TRACKER_PATH = Path(__file__).resolve().parents[2] / "CLAUDE_TASK_TRACKER.md"

TASK_PATTERN = re.compile(r"^- \[( |x)\] (.+)")


def _read_tracker() -> List[str]:
    return TRACKER_PATH.read_text().splitlines(True)


def list_tasks() -> None:
    for line in _read_tracker():
        m = TASK_PATTERN.match(line)
        if m:
            status = "done" if m.group(1) == "x" else "pending"
            print(f"{status:7} - {m.group(2)}")


def mark_complete(keyword: str) -> None:
    lines = _read_tracker()
    new_lines = []
    keyword_lower = keyword.lower()
    updated = False
    for line in lines:
        m = TASK_PATTERN.match(line)
        if m and keyword_lower in m.group(2).lower() and m.group(1) != "x":
            line = line.replace("[ ]", "[x]", 1)
            updated = True
        new_lines.append(line)
    TRACKER_PATH.write_text("".join(new_lines))
    if updated:
        print(f"Marked tasks containing '{keyword}' as complete.")
    else:
        print(f"No pending task matched '{keyword}'.")


def add_task(section: str, task: str) -> None:
    lines = _read_tracker()
    section_header = f"## {section}"
    for idx, line in enumerate(lines):
        if line.strip() == section_header:
            lines.insert(idx + 1, f"- [ ] {task}\n")
            TRACKER_PATH.write_text("".join(lines))
            print(f"Added task under '{section}'.")
            return
    raise ValueError(f"Section '{section}' not found in tracker")


def main() -> None:
    parser = argparse.ArgumentParser(description="Update CLAUDE_TASK_TRACKER.md")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("list", help="List all tasks")

    cpl = sub.add_parser("complete", help="Mark task as complete")
    cpl.add_argument("keyword", help="Keyword identifying the task")

    add = sub.add_parser("add", help="Add a new task")
    add.add_argument("section", help="Tracker section name")
    add.add_argument("task", help="Task description")

    args = parser.parse_args()

    if args.cmd == "list":
        list_tasks()
    elif args.cmd == "complete":
        mark_complete(args.keyword)
    elif args.cmd == "add":
        add_task(args.section, args.task)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
