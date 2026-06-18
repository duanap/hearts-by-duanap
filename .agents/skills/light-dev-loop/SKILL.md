---
name: light-dev-loop
description: Lightweight coding workflow for Codex. Use when modifying, debugging, refactoring, reviewing, or adding tests in a codebase. Focus on small safe changes, local validation, and concise summaries.
---

# Light Dev Loop

Use this workflow whenever the user asks to modify code, fix bugs, refactor, add tests, review code, or understand implementation details.

## Core Principles

- Prefer the smallest correct change.
- Read before editing.
- Do not rewrite unrelated files.
- Do not introduce new production dependencies unless explicitly requested.
- Preserve existing style, naming, architecture, and formatting.
- Favor simple code over clever abstractions.
- When uncertain, inspect nearby code and tests before deciding.
- Never claim tests passed unless they were actually run.

## Workflow

### 1. Understand

Before editing:

1. Identify the user's concrete goal.
2. Inspect the relevant files.
3. Locate existing patterns, helpers, tests, and conventions.
4. Briefly state the intended change before making broad edits.

Avoid large speculative rewrites.

### 2. Plan Briefly

For non-trivial tasks, produce a compact plan:

- Files likely involved
- Main change
- Validation command, if discoverable

Keep the plan short and update it as work completes.

### 3. Edit Safely

- Make focused edits.
- Keep public APIs stable unless the task requires changing them.
- Prefer existing utilities over new abstractions.
- Add comments only when they clarify non-obvious logic.

### 4. Validate

Run the narrowest relevant validation:

- Unit test for touched behavior
- Typecheck for TypeScript changes
- Lint/check script if the project provides one
- Build only when the change affects bundling or release output

If a command fails, inspect the failure before changing more code.

### 5. Summarize

End with:

- What changed
- What validation ran
- Any remaining risk or follow-up
