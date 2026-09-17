---
name: domain-modeling-matt
description: Build and sharpen the project's ubiquitous domain language. Use when introducing new domain concepts, editing CONTEXT.md, or documenting decisions in docs/adr/.
source: https://github.com/mattpocock/skills
license: MIT
---

# Domain Modeling & Ubiquitous Language

Actively refine the project's domain model and vocabulary to prevent misalignment between engineers, business requirements, and AI agents.

## Core Rules

1. **Ubiquitous Glossary (`CONTEXT.md`)**:
   - Every domain entity, property, or specific concept must have an agreed unambiguous name.
   - When introducing a new term (e.g. `RestaurantDetailsScreen`, `contactActions`), record its meaning and purpose in `CONTEXT.md`.

2. **Architectural Decision Records (`docs/adr/`)**:
   - Non-trivial structural decisions, third-party library choices, or data flow adjustments require an ADR.
   - Follow standard ADR format: Status, Context, Decision, Consequences.

3. **Concision**:
   - Establish shared terminology so discussions and code express concepts in fewer, more precise words.
