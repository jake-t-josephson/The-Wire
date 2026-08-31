# The Wire

The Wire is a sports scores, standings, news, editorial, and podcast application built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

Before making structural or UI changes, read:

- [`DESIGN.md`](./DESIGN.md) — brand, visual language, typography, color, and content rules.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — application layers, dependency direction, component ownership, and target structure.
- [`CLAUDE.md`](./CLAUDE.md) — operational rules and verification checklist for contributors and coding agents.

The internal UI showcase is available at `/ui` during local development.

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run check
```

## Current architecture work

The repository is moving incrementally toward the structure documented in `ARCHITECTURE.md`. New work should follow the target boundaries even when nearby older code has not yet been migrated.

## Vite reference

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
