---
name: web-frontend
description: Strict developer constraints and coding rules for React, TypeScript, and modern web frontend development (Vite, Next.js, etc.). Use this for login, forms, dashboard, API interaction, and long-term project maintenance to prevent unstructured JSX and loose typing.
---

# Web Frontend Skill: React + TypeScript

## Stack
- React + TypeScript
- Vite or Next.js depending on the project
- Tailwind CSS only if the project already uses it or the user requests it
- Functional components and hooks
- `.tsx` for components and `.ts` for utilities

## Strict TypeScript Rules
- Do not generate JavaScript files.
- Do not use `any` or `as any`.
- Do not use `@ts-ignore` or `@ts-expect-error` unless you explain why it is unavoidable.
- Define explicit types for component props, API responses, form data, route params, and state objects.
- If external data shape is uncertain, use `unknown` first, then validate or narrow it.
- Do not silence TypeScript errors. Fix the underlying type or data model.

## Component Rules
- Keep components small and single-purpose.
- Separate UI components, hooks, API calls, and type definitions when the file becomes large.
- Avoid deeply nested JSX.
- Avoid duplicating UI logic across pages.
- Extract repeated UI patterns into reusable components.

## Data and API Rules
- Never assume API response shapes silently.
- Define response types before consuming response data.
- Handle loading, empty, error, and success states.
- Avoid direct fetch logic inside large UI components; prefer a separate api/client layer or hooks.

## State Rules
- Use local state for local UI.
- Use context or a state library only when state is shared across distant components.
- Do not introduce global state unless necessary.
- Keep derived state derived instead of duplicating it.

## Quality Checks
- After making changes, check for TypeScript errors.
- Check for unused imports and dead code.
- Explain any remaining limitation clearly.
- Prefer code that is boring, readable, and maintainable over clever code.
