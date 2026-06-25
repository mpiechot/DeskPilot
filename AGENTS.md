# Agent Instructions

## GitHub Identity

Codex must use the GitHub user `portfolio-pirat` for all Git and GitHub operations in this project.

It is explicitly forbidden to use the GitHub user `mpiechot` for:

- commits
- pushes
- issues
- labels
- milestones
- releases
- any GitHub API operation
- any `gh` CLI operation

Before committing or pushing, Codex must verify the active Git identity.

Expected local Git identity for this repository:

```bash
git config user.name
# portfolio-pirat

git config user.email
# mattzeal@gmail.com
```

If the active identity is not `portfolio-pirat`, Codex must stop and fix the repository-local Git configuration before continuing.

Preferred setup:

```bash
git config user.name "portfolio-pirat"
git config user.email "mattzeal@gmail.com"
```

Codex must not change the global Git identity.
Use repository-local Git configuration only.

## Project Mode

This is an autonomous Codex project.

The user will not review pull requests.
Do not create pull requests unless explicitly requested.

Work directly on `main`.

## Prime Directive

Codex may manage implementation, planning, issues, milestones, labels, documentation, architecture notes and technical sequencing.

Codex must not change the project vision, the product goal or the intended finished product.

The goal of DeskPilot is fixed:

> Build a local desktop control panel for browser session management, workflow switching and later desk automation.

Codex may adjust how this goal is reached, but not what the goal is.

## When Asked To Continue

When the user says something like "continue", "mach weiter" or "work on DeskPilot":

1. Inspect the repository state.
2. Read `AGENTS.md`.
3. Read `README.md`.
4. Read all files in `docs/`.
5. Inspect open GitHub issues and milestones.
6. Determine the most important next step.
7. If no suitable issue exists, create one.
8. Work on one focused improvement.
9. Run relevant build, test and lint commands.
10. Commit directly to `main`.
11. Update the related issue.
12. Update `docs/WORKLOG.md`.
13. Update `docs/ROADMAP.md` if project planning changed.
14. Add concerns, risks or annoyances to `docs/GRUMBLE_LOG.md` when useful.

## First Implementation Session

If the repository contains only documentation and no implementation:

1. Create the initial Electron + React + TypeScript project structure.
2. Set up the basic development commands.
3. Create the first GitHub milestone.
4. Create initial GitHub issues only if useful.
5. Begin implementation immediately.

Do not stop after only creating issues or planning documents.

## Pull Requests

Do not create pull requests by default.

Use direct commits to `main`.

## Planning Rights

Codex may:
- create GitHub issues
- create milestones
- create labels
- split work into smaller issues
- prioritize issues
- close outdated issues
- document estimates
- document actual effort
- document risks
- document technical decisions
- complain constructively in `docs/GRUMBLE_LOG.md`

## Progress Reporting

Codex should maintain project visibility for the user.

Use GitHub issues, milestones and documentation to show:

- what is currently being worked on
- what was completed
- what is planned next
- what is blocked
- rough effort estimates
- actual effort when known
- risks or concerns

The user should be able to understand the project state without reading the code.

## Required Work Style

Keep changes small and focused.

Prefer a working MVP over a perfect architecture.

Do not build speculative features before the browser-session workflow is usable.

Always preserve user data.

Session data must be stored safely and recoverably.

Never silently delete user session data.

## Stopping Point

When ending a work session, Codex must leave the project in a clean state.

Before stopping:

1. Make sure the repository builds, or document why it does not.
2. Commit all completed work.
3. Do not leave unrelated uncommitted changes.
4. Update `docs/WORKLOG.md`.
5. Clearly document the next recommended step.
6. If something is broken or incomplete, document it clearly.

A future Codex session must be able to continue without additional user context.