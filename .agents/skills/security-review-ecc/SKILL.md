---
name: security-review-ecc
description: Use when implementing authentication, handling user inputs, managing credentials, designing API endpoints, or manipulating database queries.
source: https://github.com/affaan-m/ECC
license: MIT
---

# Security Review (ECC Standard)

Rigorous security review checklist and defensive programming practices.

## When to Activate

- Implementing or altering authentication/authorization middleware
- Handling user input, query params, or URL segments
- Adding or modifying environment variables and secrets
- Designing endpoints interacting with PostgreSQL via Prisma or Supabase
- Reviewing pull requests prior to merging

## Security Checklist

### 1. Secrets & Credentials Management
- **NEVER** hardcode tokens, API keys, database passwords, or JWT secrets in source code.
- Always load sensitive configuration from environment variables (`process.env.*`).
- Keep `.env` and `.env.local` strictly in `.gitignore`.
- Ensure public client apps (Expo Mobile) only receive public anonymous keys, never backend service keys.

### 2. Input Validation (Contract-First)
- All incoming payloads MUST be validated using Zod schemas from `packages/contracts`.
- Reject unexpected or malicious fields before they reach the service layer.
- Sanitize strings, enforce length limits, and validate email/phone/URL formats.

### 3. Database & ORM Safety
- Use Prisma ORM parameterized queries exclusively; avoid raw SQL string concatenation (`$queryRawUnsafe`).
- Enforce tenant isolation / user ownership checks on all mutating operations (UPDATE, DELETE).
- Prevent dual-write state desynchronization using compensating transactions (see `.agents/rules/backend-prisma-supabase.md`).

### 4. API Endpoint Hardening
- Implement appropriate rate limiting on authentication and sensitive endpoints.
- Return semantic HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
- Do not expose internal server errors or database stack traces in production JSON responses.
