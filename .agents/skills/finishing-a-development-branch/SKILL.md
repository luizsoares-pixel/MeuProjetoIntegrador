---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
source: https://github.com/obra/superpowers
license: MIT
---

# Finishing a Development Branch

## Overview

**Core principle:** Verify tests -> Detect environment -> Present options -> Execute choice -> Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Step 1: Verify Tests

Run the full project test suite (`npm run verify` or `npm run test:api`).
If any test fails, STOP and resolve before finishing the branch.

## Step 2: Ensure Branch Standards

In Menu Digital, development branches follow the convention defined in `CONTRIBUTING.md`:
`feature/<issue-number>-<description>` (e.g. `feature/55-restaurant-details-screen`).

## Step 3: Check Documentation and Artifacts

Ensure:
- [ ] Relevant tests are written and passing.
- [ ] If new domain terms were created, `CONTEXT.md` is updated.
- [ ] If architectural decisions were made, an ADR in `docs/adr/` is created.
- [ ] Contracts build cleanly (`npm run build:contracts`).

## Step 4: Present Options to Developer

Present choices cleanly:
1. Push branch to origin and open a Pull Request via GitHub CLI (`gh pr create`).
2. Keep the branch local for further manual testing.
3. Merge locally into target branch (e.g., `main`).

Wait for developer confirmation before pushing or merging.
