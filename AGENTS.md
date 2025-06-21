# Codex Task Update Agent Guide

This repository includes a task tracker (`CLAUDE_TASK_TRACKER.md`) and a detailed plan (`DETAILED_TASK_PLAN.md`). Codex agents should keep these files in sync with the code base.

## Using the Task Agent

A helper script `meeting-intelligence/src/task_agent.py` automates basic updates to the tracker.

### Commands

- `python meeting-intelligence/src/task_agent.py list`
  - Display all tasks and their status.
- `python meeting-intelligence/src/task_agent.py complete "<keyword>"`
  - Mark the first pending task containing `<keyword>` as complete.
- `python meeting-intelligence/src/task_agent.py add "<Section>" "<Task description>"`
  - Add a new task under the specified section heading in the tracker.

## Workflow

1. After implementing a feature or fixing a bug, update `CLAUDE_TASK_TRACKER.md` using the task agent.
2. If new work arises, add it to the tracker and summarize it in `DETAILED_TASK_PLAN.md`.
3. Commit code and documentation changes together with a clear message referencing the tasks.
4. Run `pytest` before submitting a pull request. If dependencies are missing, note this in the PR.
