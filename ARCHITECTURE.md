# The Wire — Architecture

This document defines the intended structure of The Wire and the dependency boundaries that keep the product consistent as leagues and editorial features are added.

`DESIGN.md` defines the visual and editorial language. `CLAUDE.md` defines the day-to-day implementation rules. This document defines where code belongs and how layers may depend on one another.

## Architectural goals

- One design token change should propagate across the product.
- One primitive change should update every instance of that interaction.
- EPL, NFL, and future leagues should share presentation components without sharing provider-specific data shapes.
- Pages should orchestrate data and compose components, not become local design systems.
- Accessibility, responsive behavior, loading states, and themes are component responsibilities.
- Provider and persistence details should not leak into reusable UI.

## Application layers

```text
Routes and pages
        ↓
Feature composition and hooks
        ↓
Normalized sports/editorial view models
        ↓
Shared domain components
        ↓
UI and layout primitives
        ↓
Semantic design tokens
```

Data flows in the opposite direction through adapters:

```text
ESPN / Supabase / podcast feeds
        ↓
Provider clients
        ↓
League or feature adapters
        ↓
Normalized view models
        ↓
Components
```

Lower layers must never import higher layers.

## Target repository structure

```text
src/
  app/
    App.tsx
    routes.tsx

  styles/
    index.css
    tokens.css
    reset.css
    utilities.css
    primitives.css
    navigation.css

  components/
    ui/
      Button.tsx
      IconButton.tsx
      LinkButton.tsx
      Select.tsx
      SegmentedControl.tsx
      Tabs.tsx
      Badge.tsx
      Panel.tsx
      Skeleton.tsx
      EmptyState.tsx
      ErrorState.tsx
    layout/
      Page.tsx
      SportDashboardLayout.tsx
    sports/
      GameRow.tsx
      Scoreline.tsx
      GameStatus.tsx
      PeriodNavigator.tsx
      BroadcastBadge.tsx
      TeamCrest.tsx
      StatusDot.tsx
      standings/
      news/
    player/
    podcasts/

  features/
    home/
    epl/
    nfl/
    podcasts/
    player/

  pages/
    Home.tsx
    Podcasts.tsx
    StyleGuide.tsx
    epl/
    nfl/

  lib/
    adapters/
      epl.ts
      nfl.ts
    providers/
    cn.ts
    theme.ts
```

The current repository will move toward this structure incrementally. Do not perform a broad file move without a corresponding feature migration.

## Layer responsibilities

### Design tokens

Own:

- Semantic color roles
- Typography families and scales
- Spacing and layout constants
- Radius, control height, motion, focus, and elevation
- Dark and light theme values
- Editorial-surface tokens

Tokens must describe meaning, not a single component. Prefer `--color-editorial-muted` over `--wireroom-caption-color`.

### UI primitives

Own:

- Generic interaction semantics
- Keyboard behavior
- Focus, disabled, loading, pressed, and selected states
- Stable sizes and variants
- Theme-safe visual treatment

UI primitives must not know about sports, podcasts, routes, Supabase, or specific providers.

### Layout primitives

Own:

- Page width and gutters
- Standard page headers
- Shared responsive grids
- Reusable content/rail relationships

They should not fetch data or encode league-specific rules.

### Domain components

Own reusable sports or editorial vocabulary:

- Games and scorelines
- Game status
- Team identity
- Standings
- Article lists and source filters
- Broadcast information
- Editorial blocks

Domain components consume normalized view models. They do not consume raw ESPN or Supabase responses.

### Feature components

Own behavior genuinely specific to one product feature, such as podcast playback, the persistent player, or the Home editorial composition.

Feature components may compose domain components and primitives. They should not recreate generic controls.

### Pages

Own:

- Route parameters
- Data loading
- Error and loading orchestration
- Page-level composition
- URL-backed state

Pages should not define generic buttons, tabs, cards, news filters, navigators, or provider-normalization logic.

### Provider clients and adapters

Provider clients fetch and validate external data. Adapters translate it into stable application view models.

Example:

```ts
interface GameRowModel {
  id: string;
  href: string;
  home: TeamModel;
  away: TeamModel;
  status: GameStatusModel;
  broadcasts: BroadcastModel[];
  venue?: string;
}
```

EPL and NFL may have different adapters but should render the same shared component when their presentation requirements match.

## Dependency rules

Allowed:

```text
page → feature → domain → primitive → token
page → adapter → provider
feature → adapter
domain → normalized model
```

Not allowed:

```text
primitive → page
primitive → provider
domain component → ESPN response type
provider client → React component
shared component → league route
```

## UI component decision tree

Before adding a component:

1. Is it a generic control or visual foundation? Put it in `components/ui`.
2. Does it only control reusable layout? Put it in `components/layout`.
3. Does it represent sports or editorial vocabulary shared across screens? Put it in a domain directory.
4. Is it specific to a single feature but reused within that feature? Put it in the feature directory.
5. Is it only orchestration for one route? Keep it in the page.
6. Does a substantially similar component already exist? Extend or normalize that component instead of adding another.

## Styling architecture

Styles are divided into four categories:

1. Tokens: semantic variables and theme mappings.
2. Foundations: reset, typography, focus, and utilities.
3. Components: reusable component styling.
4. Features: styles unique to a product feature.

Static styling belongs in CSS or deliberate component variants. Inline styling is limited to runtime-calculated values.

Source-brand colors are external identity data, not product tokens. Keep them in a source metadata module and do not reuse them for product state.

## State ownership

- URL state: route, selected league, entity identifier, and shareable filters.
- Page state: data loading, errors, and page-level selection.
- Component state: local interaction details that do not need to survive navigation.
- Player provider: cross-route playback state only.
- Theme hook/provider: persisted display preference only.

Avoid placing unrelated application state in a global context.

## Accessibility architecture

Accessibility is enforced at the lowest reusable layer:

- Button semantics in button primitives.
- Keyboard tab behavior in Tabs.
- Pressed state in segmented controls.
- Accessible values in progress components.
- Link semantics in navigable rows.
- Focus styling in shared foundations.

Pages should receive accessible components by default rather than repairing them locally.

## Responsive architecture

- Start with the component's narrow layout.
- Expand through shared breakpoints.
- Avoid page-specific overrides for a component's internal behavior.
- Tables and dense score rows must define an intentional narrow representation.
- Horizontal scrolling is acceptable for tab lists and data tables only when explicitly designed.
- Page-level horizontal overflow is never acceptable.

## Testing strategy

### Primitive tests

- Keyboard interaction
- Accessible roles and names
- Disabled, pressed, and selected behavior
- Variant rendering

### Domain tests

- Normalized model rendering
- Live/final/scheduled states
- Winning/losing emphasis
- Missing logo and missing data fallbacks

### Page tests

- Loading, success, empty, and error orchestration
- Route and URL behavior
- Critical user journeys

### Visual review

The `/ui` route is the contract for reusable UI. Every reusable component and material variant must be represented there in dark, light, narrow, and relevant state examples.

## Change checklist

For every feature or UI change:

1. Identify the owning layer.
2. Check for an existing component or normalized model.
3. Update tokens or variants instead of copying styles.
4. Include accessibility and narrow-layout behavior.
5. Add or update `/ui` examples for reusable changes.
6. Add tests at the lowest layer that owns the behavior.
7. Run build, lint, UI checks, and browser verification.
8. Update architecture or design documentation when introducing a new pattern.

## Current migration priorities

1. Split the global stylesheet into token, foundation, component, and feature layers.
2. Harden UI primitives and eliminate raw controls in pages.
3. Replace clickable non-interactive elements with links or buttons.
4. Normalize EPL and NFL data and extract shared sports components.
5. Decompose large dashboard and Home page files.
6. Migrate Podcasts and Player controls onto shared foundations.
7. Expand `/ui` and add automated interaction/accessibility tests.
8. Lazy-load routes and resolve current build/lint warnings.
