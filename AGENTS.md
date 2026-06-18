## Codex Local Agent Configuration

This repository intentionally contains Codex agent configuration files.

Do not delete, rename, move, or clean up the following paths unless the user explicitly asks:

- `AGENTS.md`
- `.agents/`
- `.agents/skills/`
- `.agents/skills/light-dev-loop/`
- `.agents/skills/light-dev-loop/SKILL.md`

These files are not unrelated project clutter. They define Codex working rules and reusable development workflows for this repository.

When modifying the project:

- Preserve `.agents/skills/**`.
- Do not remove agent skills during cleanup, refactor, formatting, dependency pruning, or repository organization tasks.
- If a requested cleanup appears to include these files, ask for explicit confirmation before touching them.

## Project Rules

- Keep changes minimal and focused.
- Do not add dependencies unless explicitly requested.
- Before editing, inspect nearby files for existing patterns.
- After code changes, run the narrowest relevant test, lint, or typecheck command.
- If validation cannot be run, explain why.
- Summarize changed files and validation results at the end.

## Preferred Response Style

- Use Chinese when replying to the user.
- Be concise.
- When fixing bugs, explain the root cause and the fix.
