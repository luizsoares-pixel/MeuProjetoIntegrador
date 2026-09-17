---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
source: https://github.com/obra/superpowers
license: MIT
---

# Subagent-Driven Development

Execute plan by dispatching a fresh implementer subagent per task, a task review (spec compliance + code quality) after each, and a broad whole-branch review at the end.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + task review (spec + quality) + broad final review = high quality, fast iteration

**Narration:** between tool calls, narrate at most one short line — the ledger and the tool results carry the record.

**Continuous execution:** Do not pause to check in with your human partner between tasks. Execute all tasks from the plan without stopping. The only reasons to stop are the four named below, or all tasks complete. "Should I continue?" prompts and progress summaries waste their time — they asked you to execute the plan, so execute it.

**Rulings, not stalls.** A running plan does not wait on a human. Conflicts, ambiguities, plan defects, a cap you would have asked to exceed — decide them. The spec is the binding authority, the plan is its argument, and your judgment settles what neither answers. Record every decision in the ledger as `Ruling: <what you decided> — <why> — <what it costs if wrong>`, and keep going. A wrong ruling costs rework your human partner can see and undo; a session parked on a question costs their whole day and buys nothing.

Four things stop you, and only these: an irreversible or destructive operation; a security-sensitive action; a side effect outside this worktree that norms say you ask about first (a merge, a push to a shared branch, a publish); and a plan so broken that every path forward is a guess. For those, stop and ask.

## When to Use

Use this skill when:
- You have an approved implementation plan
- Tasks are mostly independent of each other
- You want fresh context per task (no context pollution)
- You want review after each task (spec compliance + code quality)
- You want a broad final review at the end

vs. `executing-plans` (parallel session):
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Review after each task (spec compliance + code quality), broad review at the end
- Faster iteration (no human-in-loop between tasks)

## The Process

1. **Setup**: Ensure work happens in an isolated workspace (feature branch or worktree). Read the plan once, note context and Global Constraints. Create a todo per task.

2. **Pre-flight scan**: Before dispatching Task 1, scan the plan for conflicts:
   - Tasks that contradict each other or the plan's Global Constraints
   - Anything the plan mandates that the review rubric treats as a defect
   - Write results to `docs/superpowers/plans/<plan-name>/progress.md` as the ledger

3. **Per task loop**:
   - Dispatch a fresh implementer subagent with precise context
   - Answer questions if the implementer asks
   - After implementation: generate review package, dispatch task reviewer
   - If findings: dispatch fix rounds (max 5), then adjudicate
   - Append completion to ledger, mark todo complete

4. **Final review**: After all tasks complete, dispatch a broad code reviewer. Apply findings in one fix dispatch, one scoped re-review, adjudicate residuals.

5. **Finish**: Run `finishing-a-development-branch` skill.

## Ledger Format

Keep a ledger at `docs/superpowers/plans/<plan-name>/progress.md`:

```markdown
# SDD ledger — plan: <plan file path>

## Task 1: <name>
- Status: complete
- Commit: <hash>
- Rulings: <any decisions made>

## Task 2: <name>
- Status: in-progress — fix round 2
```

The ledger is your recovery map: the commits it names exist in git even when your context no longer remembers creating them.

## Integration with Menu Digital

When working on Menu Digital issues:
1. Plans go in `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
2. Follow `feature/<issue-number>-<description>` branch convention (per CONTRIBUTING.md)
3. Always run `npm run verify` before marking a task complete
4. Tests must pass (118+ passing) before marking complete
