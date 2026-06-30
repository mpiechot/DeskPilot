# Agent Instructions

## GitHub Identity

Codex must use the Git identity `portfolio-pirat <mattzeal@gmail.com>` for local commits in this project.

It is acceptable if `git push` uses the existing machine GitHub credential, even if that credential belongs to `mpiechot`.

It is explicitly forbidden to use the GitHub user `mpiechot` for all other GitHub operations, including:

- commits
- issues
- labels
- milestones
- releases
- any GitHub API operation
- any `gh` CLI operation

Before committing, Codex must verify the active local Git identity.

Expected local Git identity for this repository:

```bash
git config user.name
# portfolio-pirat

git config user.email
# mattzeal@gmail.com
```

If the active local Git identity is not `portfolio-pirat`, Codex must stop and fix the repository-local Git configuration before committing.

Preferred setup:

```bash
git config user.name "portfolio-pirat"
git config user.email "mattzeal@gmail.com"
```

Codex must not change the global Git identity.
Use repository-local Git configuration only.

Except for the working pull request quality workflow documented below, GitHub issue, milestone, label, release, API and `gh` CLI operations remain forbidden unless the user explicitly allows them again.

## Project Mode

This is an autonomous Codex project.

The user will not review pull requests as a normal development gate.

Use one open working pull request as the continuous quality-gate workspace for CI, SonarQube and ReviewDog feedback.

Do not create multiple parallel working pull requests. If more than one suitable open working pull request exists, stop and ask the user which one to continue.

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
5. Inspect local planning documents.
6. Check for the single open DeskPilot working pull request targeting `main`.
7. If one open working pull request exists, switch to that PR branch and continue work there.
8. If no open working pull request exists, update `main`, create a new branch from `main`, and use it for the work session.
9. If more than one suitable open working pull request exists, stop and ask the user which one to continue.
10. Before normal implementation work, inspect unresolved PR review comments, ReviewDog comments, SonarQube findings and failing checks.
11. Address actionable feedback and change requests first.
12. Determine the most important next project step.
13. If no suitable local plan exists, document one in `docs/WORKLOG.md` or `docs/ROADMAP.md`.
14. Work on one focused improvement.
15. Run relevant build, test and lint commands.
16. Commit completed work to the working branch.
17. If this session created a new branch, push it and open a pull request against `main`.
18. If this session continued an existing working pull request, push the branch updates to that pull request.
19. Update the related local planning document.
20. Update `docs/WORKLOG.md`.
21. Update `docs/ROADMAP.md` if project planning changed.
22. Add concerns, risks or annoyances to `docs/GRUMBLE_LOG.md` when useful.

## First Implementation Session

If the repository contains only documentation and no implementation:

1. Create the initial Electron + React + TypeScript project structure.
2. Set up the basic development commands.
3. Document the first local milestone in `docs/ROADMAP.md`.
4. Create initial GitHub issues or milestones only if GitHub planning operations have been separately allowed.
5. Begin implementation immediately.

Do not stop after only creating issues or planning documents.

## Pull Requests

Codex may use one open working pull request to trigger CI, SonarQube and ReviewDog feedback.

Pull requests created by Codex are quality-gate workspaces, not user-review requests.

When continuing work, Codex must first look for the existing open working pull request and continue on that branch instead of creating a new pull request.

If no open working pull request exists, Codex may create a new branch from `main`, implement one focused improvement, push the branch and open a pull request against `main`.

If exactly one open working pull request exists, Codex must inspect unresolved PR review comments, ReviewDog comments, SonarQube findings and failing checks before starting new implementation work. Actionable feedback and change requests must be addressed first.

If more than one suitable open working pull request exists, Codex must stop and ask the user which one to continue.

Allowed GitHub operations for this workflow are limited to:

- listing open pull requests targeting `main`
- creating a working pull request when none exists
- reading PR comments, reviews, checks, ReviewDog feedback and SonarQube feedback
- checking out or switching to the working pull request branch
- pushing commits to the working pull request branch
- merging or closing the working pull request when the work is complete

Codex must not create GitHub issues, labels, milestones or releases unless separately allowed.

The GitHub user `mpiechot` remains forbidden for all GitHub API and `gh` CLI operations unless the user explicitly allows it again.

## Planning Rights

Codex may:
- split work into smaller issues
- prioritize issues
- close outdated issues
- document estimates
- document actual effort
- document risks
- document technical decisions
- complain constructively in `docs/GRUMBLE_LOG.md`

GitHub issue, milestone and label operations require separate user permission.

## Progress Reporting

Codex should maintain project visibility for the user.

Use documentation, and GitHub issues or milestones only when separately allowed, to show:

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
