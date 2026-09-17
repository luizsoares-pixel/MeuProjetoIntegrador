---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
source: https://github.com/obra/superpowers
license: MIT
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use

**Always:**
- New features
- Bug fixes
- Refactoring
- Behavior changes

**Never skip because:**
- "It's a small change" — small changes have bugs too
- "I'm in a hurry" — TDD is faster in the medium term
- "The test is obvious" — write it anyway; obvious tests catch regressions

## The Process

### 1. Write the test
```
Before a single line of implementation code.
```

### 2. Run the test — watch it FAIL
```
If it passes before implementation, the test is wrong.
A passing test before implementation = you're not testing the right thing.
```

### 3. Write MINIMAL implementation
```
Only enough code to make the test pass.
No more. No gold-plating. No "while I'm here" changes.
```

### 4. Run the test — watch it PASS

### 5. Refactor
```
Now clean up. The tests protect you.
```

## Menu Digital Test Patterns

### API Tests (Node.js native)

```typescript
import test from "node:test";
import assert from "node:assert/strict";

// Mock Prisma
(prisma as any).restaurant = {
  findUnique: async () => ({
    id: "uuid",
    name: "Test Restaurant",
    // ... all required fields
  }),
};

test("GET /restaurants/:id returns restaurant data", async () => {
  const res = await request(app).get("/restaurants/test-uuid");
  assert.equal(res.status, 200);
  assert.ok(res.body.restaurant.id);
});

test("GET /restaurants/:id returns 404 for unknown id", async () => {
  (prisma as any).restaurant.findUnique = async () => null;
  const res = await request(app).get("/restaurants/nonexistent");
  assert.equal(res.status, 404);
});
```

**Run:** `npm run test -w apps/api`

### Mobile Tests (Jest/Expo)

```typescript
import { render, screen } from "@testing-library/react-native";

it("renders restaurant name", () => {
  render(<RestaurantCard name="Test" />);
  expect(screen.getByText("Test")).toBeTruthy();
});
```

**Run:** `npm run test -w apps/mobile`

## Anti-Patterns

- Writing implementation first, then tests (this is "test-after", not TDD)
- Writing tests that never fail
- Writing one giant test instead of small focused tests
- Mocking everything (test the integration, not the mocks)
- Skipping edge cases (null, empty, boundary values)

## Coverage Targets

- API: aim for 90%+ on service functions
- Mobile: aim for 80%+ on business logic
- Always test: 404s, validation errors, empty states
