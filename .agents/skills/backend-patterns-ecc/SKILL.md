---
name: backend-patterns-ecc
description: Backend architecture patterns, clean layered design, and Express 5 / Prisma best practices.
source: https://github.com/affaan-m/ECC
license: MIT
---

# Backend Development Patterns (ECC Standard)

Architecture guidelines for Express 5, TypeScript, and Prisma ORM in the Menu Digital backend.

## Layered Architecture

Always separate concerns strictly across three layers:

```
Request -> Controller (HTTP parsing, Zod validation)
             ↓
           Service (Business logic, calculations, orchestration)
             ↓
           Prisma ORM (Database access & persistence)
```

1. **Routes & Controllers (`apps/api/src/routes/` & `controllers/`)**:
   - Parse HTTP headers, params, and body.
   - Validate with Zod contracts before calling services.
   - Map domain errors to semantic HTTP status codes.

2. **Service Layer (`apps/api/src/services/`)**:
   - Pure business logic independent of Express request/response objects.
   - Easily unit-testable by mocking Prisma clients.
   - Calculates routes, distances, sorting, and availability.

3. **Data Access (`Prisma Client`)**:
   - Encapsulated within service methods.
   - Use relations and joins efficiently (`include: { photos: true }`) to avoid N+1 queries.

## Error Handling Pattern

- Define specific domain errors (e.g. `NotFoundError`, `ConflictError`).
- Use centralized error-handling middleware in Express 5.
- Log error details server-side while returning sanitized messages to clients.
