<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Coding Best Practices

## Project Structure

```
src/
  app/          # App Router pages & layouts
  components/   # Shared UI components
  lib/          # Utilities, helpers, constants
  hooks/        # Custom React hooks
  types/        # Shared TypeScript types
  actions/      # Server Actions
```

## TypeScript & React

- Use `strict` mode (already enabled in tsconfig)
- Prefer `interface` over `type` for object shapes; use `type` for unions, primitives, and mapped types
- Use `Readonly<Props>` for component props when all are readonly
- Use `satisfies` operator for type-safe object literals
- Use `as const` for literal unions and tuples
- Avoid `any` — use `unknown` then narrow with type guards
- Avoid `enum` — prefer `as const` objects with `satisfies`

## React & Next.js Patterns

- **Server-first**: components are Server Components by default. Only add `"use client"` when you need interactivity (event handlers, hooks, browser APIs).
- **Async Server Components**: fetch data directly in Server Components; no `useEffect` for data fetching.
- **Server Actions**: colocate mutations with the component that needs them. Use `"use server"` in a separate file for reusable actions.
- **Layouts**: use `layout.tsx` for persistent UI; avoid re-fetching data by using parallel routes or `Promise.all`.
- **Loading & Error**: always provide `loading.tsx` and `error.tsx` for routes that fetch data.
- **Search params**: use `useSearchParams()` or `searchParams` prop; prefer the prop for Server Components.
- **CSS**: use Tailwind utility classes for styling. Avoid CSS modules and inline styles. Use `cn()` helper for conditional class merging.

## File & Component Conventions

- **Co-location**: place component, its sub-components, hooks, and tests in the same directory.
- **Naming**:
  - Components: PascalCase (`UserCard.tsx`)
  - Hooks: camelCase with `use` prefix (`useAuth.ts`)
  - Utilities: camelCase (`formatDate.ts`)
  - Types/Interfaces: PascalCase with `Props` suffix for component props (`UserCardProps`)
  - Files: match the default export name
- **One component per file** (except small closely-related sub-components).
- **Named exports** for utilities and hooks; **default exports** for pages and components.

## Code Quality

- **Zero tolerance for warnings/errors**: code must compile and pass `npm run lint` with no warnings or errors before committing
- **No dead code**: remove unused variables, functions, imports, parameters, and exports
- **No comments on implementation** — write self-documenting code with descriptive variable/function names
- Keep functions small and focused (single responsibility)
- Avoid premature abstraction; duplicate once before extracting
- Use `const` for everything that doesn't need reassignment
- Prefer early returns over nested conditionals
- Destructure props at the function parameter level

## Imports

Order imports by:

1. Node built-ins / external libraries
2. `@/` alias imports (internal)
3. Relative imports

Use path aliases (`@/`) for all internal imports, never deep relative paths.

## Performance

- Use `React.memo` only for components that re-render often with the same props
- Use `useMemo`/`useCallback` only when the computation is expensive or the reference is passed to a memoized child
- Suspend by default with Server Components streaming
- Use Next.js `<Image>` for user-facing images with explicit `width`/`height`

## Accessibility

- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>`, `<a>`)
- Always provide `alt` text on images
- Use `aria-*` attributes when native semantics are insufficient
- Ensure keyboard navigability
- Use Tailwind `sr-only` for screen-reader-only content

## State Management

- Prefer URL search params for shareable state
- Use React context sparingly and only for truly global state (theme, auth, locale)

## Error Handling

- Wrap Server Actions in try/catch and return `{ success: boolean, error?: string }`
- Use `notFound()` from `next/navigation` for 404 cases
- Use `redirect()` for 301/302 cases
- Use `error.tsx` boundary per route segment
