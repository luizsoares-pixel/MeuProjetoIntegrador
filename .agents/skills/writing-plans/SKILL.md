---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
source: https://github.com/obra/superpowers
license: MIT
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

## Scope Check

Before writing the plan, assess scope:
- **Small** (< 2 hours, 1 dev): Plan still recommended but optional
- **Medium** (2-8 hours, 1-2 devs): Plan required before coding
- **Large** (> 8 hours, multiple devs): Plan + spec required; use spec-first approach

## Plan Structure

```markdown
# Plan: <Feature Name>
Date: YYYY-MM-DD
Issue: #<number>
Spec: docs/specs/<name>.md (if exists)

## Context
<What this feature does and why>

## Global Constraints
- Must not break existing tests
- Must follow contract-first (types in packages/contracts first)
- Must follow branch naming: feature/<issue>-<description>

## Tasks

### Task 1: <Name>
**Files to modify:**
- `path/to/file.ts` — what change and why

**Implementation:**
<specific code guidance>

**Tests:**
- Test case 1: <description>
- Test case 2: <description>

**Verification:**
```bash
npm run test:api  # or test:mobile
```

**Commit message:** `feat(scope): description (#issue)`

### Task 2: ...
```

## Menu Digital Specifics

When writing plans for this project:

1. **Contract First**: Always start with types in `packages/contracts/src/index.ts`
2. **API before Mobile**: Backend task before frontend task when both are needed
3. **Test coverage**: Use `node:test` + `node:assert/strict` for API tests
4. **Branch**: `feature/<issue-number>-<description>`
5. **Verification**: End every task with `npm run test -w apps/api` or equivalent

## Anti-Patterns to Avoid

- Vague tasks like "implement authentication" — break it into concrete file-level steps
- Tasks with no tests specified
- Tasks that touch both API and Mobile (split them)
- Tasks without a verification command
- Plans that skip contract changes when API changes are made
