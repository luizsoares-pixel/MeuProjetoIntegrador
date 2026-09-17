---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
source: https://github.com/obra/superpowers
license: MIT
---

# Verification Before Completion

## Overview

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

BEFORE claiming any status, reporting task complete, or creating a PR:

1. **IDENTIFY**: What command proves this claim? (`npm run verify`, `npm run test:api`, etc.)
2. **RUN**: Execute the FULL command (fresh, complete).
3. **READ**: Full output, check exit code, count failures (e.g. 118 passing, 0 failing).
4. **VERIFY**: Does output confirm the claim?
   - If NO: State actual status with evidence and fix it.
   - If YES: State claim WITH real command evidence.
5. **ONLY THEN**: Declare the task complete.

## Monorepo Standards for Menu Digital

| Claim | Required Evidence | Not Sufficient |
|---|---|---|
| Tests pass | `npm run test -w apps/api` output: 0 failures | "Should pass", previous run |
| Monorepo verified | `npm run verify` exit 0 (contracts, api, mobile) | Checking only one workspace |
| Contracts valid | `npm run build:contracts` exit 0 | TypeScript without compiler run |
| Linter clean | `npm run lint:api` output: 0 errors | "No syntax errors found" |
| Feature complete | All acceptance criteria checked + tests written | "Code looks good" |

## Red Flags - STOP

- Using words like "should", "probably", "seems to work" without command output.
- Announcing PR or commit completion before inspecting real execution logs.
- Assuming test results without executing them.
