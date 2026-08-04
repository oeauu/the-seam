---
name: general-discipline
description: General coding discipline, quality checks, anti-decay, and clean code rules for any project (frontend, backend, scripts). Use this to prevent loose typing, quick/messy workarounds, and to maintain strict codebase integrity.
---

# General Coding Discipline Skill

## Principles
- Do not solve errors by deleting type checks, weakening types, or suppressing warnings.
- Do not introduce a new library unless it clearly reduces complexity.
- Before changing architecture, inspect the existing project structure.
- Prefer minimal, local changes over large rewrites.
- If the task is ambiguous, make a reasonable assumption and state it.
- If generated code depends on unknown files, mention the expected file path and integration point.
- After coding, provide a short checklist of what should be tested manually.
- Never claim the code is production-ready unless it has been tested.
- You cannot fix TypeScript errors by using `any`, `as any`, `@ts-ignore`, or unsafe type assertions.
- If a type is uncertain, explain what data shape is uncertain, then define a safer type, parser, validator, or narrowing function. Do not hide the error. Fix the model.
