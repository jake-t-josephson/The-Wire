# The Wire — Working Rules

Read `ARCHITECTURE.md` and `DESIGN.md` before making structural or UI changes.

This file is the operational checklist for AI coding agents and contributors. It is intentionally concise and prescriptive. When an implementation conflicts with these rules, either change the implementation or document the exception before proceeding.

## Before changing code

1. Inspect the existing primitive, component, and feature implementations before creating anything new.
2. Preserve unrelated work in the repository. The worktree may be dirty.
3. Decide which layer owns the change:
   - `components/ui`: generic interaction or presentation primitive.
   - `components/layout`: reusable application layout.
   - `components/sports`: league-independent sports presentation.
   - Feature component: behavior unique to Home, Podcasts, Player, EPL, or NFL.
   - Page: routing, data loading, error orchestration, and composition only.
4. Reuse or extend an existing component when the same interaction already exists.
5. Check `/ui` before changing a primitive and update `/ui` when its API or appearance changes.

## Non-negotiable UI rules

- Do not add raw hex, RGB, or HSL product colors in TSX or feature CSS. Use semantic tokens. Source-brand colors may live in a dedicated metadata file.
- Signal orange is reserved for live state, active navigation, section signals, and the logo dot.
- Oxblood is reserved for The Column.
- Data surfaces use ink tokens. Editorial surfaces use editorial tokens.
- Do not create static inline styles. Inline styles are allowed only for runtime-calculated values such as progress width, measured dimensions, data-driven grid tracks, and source-brand colors.
- Do not add a native `<button>`, `<select>`, or similar control in a page when a shared primitive can represent it.
- Navigation must use a real link. State-changing actions must use a real button.
- Do not use `div onClick` or `span onClick` for interaction.
- Every control must have visible keyboard focus, an accessible name, and correct disabled/selected/current state.
- Every reusable component must define responsive behavior rather than relying on page-level repairs.
- Loading, empty, error, disabled, and success states must use shared patterns.

## Component rules

- Prefer a small explicit API over arbitrary styling props.
- Use variants for deliberate visual differences; do not fork components with ad hoc class strings.
- Generic components must not import ESPN, NFL, Supabase, or route-specific data types.
- Normalize provider data in adapters before passing it to shared sports components.
- Keep feature pages focused on composition. Extract local components when a page approaches 250 lines or a pattern appears twice.
- Do not build a new EPL component and NFL component when a normalized shared sports component can serve both.
- Specialized components may wrap primitives, but should inherit their focus, disabled, sizing, and motion behavior.

## CSS rules

- Tokens belong in `src/styles/tokens.css` once the planned stylesheet split is complete.
- Primitive styles belong with the primitive layer.
- Feature styles belong with the feature; do not append unrelated feature blocks to the global stylesheet.
- Use flex or grid with `gap` for sibling spacing.
- Use semantic tokens instead of compatibility aliases in new code.
- Respect `prefers-reduced-motion`.
- Mobile behavior is part of the component definition, not a follow-up task.

## Accessibility checklist

- Can every interactive element be reached and operated with a keyboard?
- Is navigation implemented with links and action behavior with buttons?
- Does the control expose its state with native semantics or appropriate ARIA?
- Are decorative images hidden from assistive technology?
- Do meaningful images have useful alternative text?
- Are focus indicators visible against both themes?
- Do tabs implement tab panels and keyboard navigation? If not, use simpler navigation semantics.
- Are progress indicators labeled and exposing current/minimum/maximum values?

## Verification required before handoff

Run:

```bash
npm run check
```

When the UI changes, also verify:

- The affected component on `/ui`.
- Dark and light themes.
- A narrow viewport around 390px.
- Keyboard focus and activation.
- Loading, empty, error, and disabled states when applicable.
- No unexpected horizontal page overflow.

## Definition of done

A UI change is not complete until:

- It uses the correct architectural layer.
- Repeated behavior is centralized.
- Accessibility and responsive behavior are included.
- `/ui` documents new reusable states or variants.
- Build and lint complete without new warnings.
- `DESIGN.md`, `ARCHITECTURE.md`, or this file is updated if a new rule or exception was introduced.
