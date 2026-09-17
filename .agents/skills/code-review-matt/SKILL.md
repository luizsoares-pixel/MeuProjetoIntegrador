---
name: code-review-matt
description: Multi-axis code review evaluating diffs along two axes: Standards (conformance to repo conventions) and Spec (faithful implementation of issue criteria). Runs reviews via subagents.
source: https://github.com/mattpocock/skills
license: MIT
---

# Code Review (Two-Axis Review)

Review code changes between current branch `HEAD` and the base branch along two distinct axes:

1. **Standards Axis**:
   - Conformance to monorepo rules (`.agents/rules/`).
   - Contract-First discipline: schema defined in `packages/contracts` first?
   - Clean code heuristics: meaningful naming, DRY, no dead code or debugging statements (`console.log`).
   - Typing safety: no unconstrained `any` casts without clear justification.

2. **Spec / Acceptance Criteria Axis**:
   - Compares implemented features directly against the GitHub Issue description.
   - Are all acceptance criteria satisfied?
   - Are edge cases and error conditions addressed?

## Review Workflow

1. Determine base reference: `git diff origin/main...HEAD`.
2. Inspect changed files across workspaces.
3. Validate tests exist and cover the new functionality.
4. Report findings categorized as:
   - **Blocker**: Must be fixed before merge.
   - **Improvement**: Recommended enhancement.
   - **Note**: Informational observation.
