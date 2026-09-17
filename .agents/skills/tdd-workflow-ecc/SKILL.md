---
name: tdd-workflow-ecc
description: Enforces test-driven development workflow with 80%+ coverage across unit, integration, and contract tests. Use when implementing features, fixing bugs, or refactoring in Node.js/TypeScript.
source: https://github.com/affaan-m/ECC
license: MIT
---

# TDD Workflow (ECC Standard)

Comprehensive Test-Driven Development workflow ensuring high code quality and test coverage.

## When to Activate

- Implementing new user stories or endpoints
- Fixing reported bugs or edge cases
- Refactoring backend services or mobile components
- Modifying Zod contracts in `packages/contracts`

## Core Principles

1. **Tests BEFORE Code**: Never write production code without an already-failing automated test.
2. **Target Coverage**: Minimum 80% coverage across core services and domain rules.
3. **Red-Green-Refactor Cycle**:
   - **RED**: Write test case capturing the requirement. Execute and observe expected failure.
   - **GREEN**: Write minimal code to satisfy the test. Confirm it passes.
   - **REFACTOR**: Improve design, eliminate duplication, adhere to clean code principles.

## Menu Digital Test Runner Mapping

- **API Suite**: `npm run test -w apps/api` (Node.js native `node:test` + `tsx`)
- **Mobile Suite**: `npm run test -w apps/mobile` (Jest + React Native Testing Library)
- **Monorepo Build**: `npm run build:contracts` (Zod schemas compilation)

## Testing Hierarchy

1. **Contract Validation**: Test Zod schema parsing and type inference in `packages/contracts`.
2. **Service Unit / Integration**: Mock database calls (`(prisma as any).model = ...`) and test business logic.
3. **Controller & Route Integration**: Use `supertest` with Express app instances to verify HTTP status codes, headers, and payload structures.
4. **Mobile UI Components**: Render screens/components with mocks and assert semantic elements.
