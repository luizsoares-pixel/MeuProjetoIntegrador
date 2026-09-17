---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
source: https://github.com/obra/superpowers
license: MIT
---

# Systematic Debugging

## Overview

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures (Node.js API, Jest Mobile)
- Bugs in runtime or production
- Unexpected behavior or contract mismatches
- Performance problems
- Build or typecheck failures
- Integration issues between API and Mobile

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes that failed
- You don't fully understand the issue

## The Four Phases

### Phase 1: Root Cause Investigation
1. **Read Error Messages Carefully**: Read stack traces completely, file paths, line numbers.
2. **Reproduce Consistently**: Determine exact reproduction steps before touching code.
3. **Check Recent Changes**: Inspect git diff, recent commits, dependency changes.
4. **Gather Evidence in Multi-Component Systems**: Log inputs/outputs across boundaries (Mobile -> Contracts -> API -> Prisma -> DB).
5. **Trace Data Flow**: Follow the error upward to where the bad value originates.

### Phase 2: Pattern Analysis
1. Find working examples in this codebase.
2. Compare broken code against reference implementations.
3. Identify exact differences.
4. Understand dependencies and assumptions.

### Phase 3: Hypothesis and Testing
1. Form a single hypothesis: "X is the root cause because Y".
2. Write a minimal reproduction test case (TDD).
3. Confirm test fails for the expected reason.

### Phase 4: Implementation and Verification
1. Apply the minimal fix at the root cause.
2. Confirm the reproduction test passes.
3. Run full regression suite (`npm run verify`).
4. Document the fix and lessons learned.
