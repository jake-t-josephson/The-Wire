# The Wire — Design System

Working spec, v0.1. Covers brand, color, type, and the component vocabulary used in `landing.html` and `premier-league.html`.

---

## 1. Brand

**The Wire** carries two meanings and the design commits to both:

- **The newswire** — an incoming feed, machine-stamped, sourced, continuous.
- **Down to the wire** — the close finish, the last two minutes.

The product has three jobs and three voices: **scores and standings** (data), **Wireroom** (AI-assembled news), and **The Column** (your writing). The visual system keeps these separable at a glance.

### Logo

Wordmark: **THE WIRE**, uppercase, Fjalla One. A single 3px rule runs edge to edge behind it — the wire — terminating in an orange dot, the tape at the finish.

Rules:
- The wire always runs off both edges of its container. It never stops at the letterforms.
- The dot sits at the right end, sized ~4.5× the rule weight, with a ground-colored ring separating it from the rule.
- The dot is the only place color appears in the mark.
- In app chrome, the wire is not a separate graphic — **the header's bottom border is the wire**, with the dot at the far right. One instance per screen.

Clear space: one cap-height on all sides. Minimum wordmark width 96px; below that use the icon.

App icon: the wire and dot cropped in a rounded square (radius ≈ 22% of size), no letterforms.

### The dot as a state token

The logo's dot is the same dot the product uses for game state. This is the core idea of the system — the mark is functional.

| State | Treatment |
|---|---|
| Live | Filled orange, 9px |
| Final | Hollow, 2px silver ring |
| Down to the wire | Filled orange + `box-shadow: 0 0 0 4px rgba(238,90,22,.25)` halo — one score, under two minutes |
| Scheduled | No dot; kickoff time in mono instead |

---

## 2. Color

| Token | Hex | Use |
|---|---|---|
| Ink | `#0E0F10` | Primary ground for all data surfaces |
| Slate | `#151819` | Raised panels, live rail, highlighted rows |
| Hairline | `#1E2325` / `#23282A` | Row dividers / structural borders |
| Steel | `#2A2F31` | Crest placeholders, control borders |
| Muted | `#6E7476` | Secondary labels, timestamps |
| Silver | `#A8AEB0` | Losing side, stat values, de-emphasized text |
| Bone | `#EFEBE4` | Primary text on ink; ground for editorial surfaces |
| **Signal** | `#EE5A16` | Live state, active nav, section labels, the dot |
| Oxblood | `#7A2B2B` | **Reserved for The Column.** Never used for data or UI state |
| Up | `#6DA36D` | Position gained |
| Down | `#B4614A` | Position lost |

**Discipline:** signal orange is a state color, not a decoration. It appears on live indicators, the active nav item, section labels, and the logo dot — nowhere else. If a screen has more than ~6 orange elements, something has been over-emphasized.

Editorial content (Wireroom, Column) sits on **bone**; data sits on **ink**. That inversion, not a color, is what separates the voices.

---

## 3. Type

| Role | Face | Notes |
|---|---|---|
| Display / data | **Fjalla One** (400, single weight) | Uppercase. Team names, scores, standings, headlines, section titles |
| Editorial | **Crimson Pro** (400, 600, italic 400) | Mixed case. Column copy, Wireroom body, captions |
| Labels / data-adjacent | **DM Mono** (400, 500) | Uppercase, tracked `.14em`–`.28em`. Timestamps, source chips, table headers, nav |

Fjalla One has one weight — hierarchy comes from **size and color**, not weight. Losing team = silver, winning team = bone.

### Scale

Screens are designed at **1440px** wide.

| Element | Size / line-height |
|---|---|
| Page title | 54px / .95, Fjalla |
| Section headline | 40px / 1.02, Fjalla |
| Card headline | 21–26px / 1.1, Fjalla |
| Score row (team) | 26px / 1, Fjalla |
| Score (numeral) | 27px / 1, Fjalla |
| Standings row | 17–18px / 1, Fjalla |
| Column headline | 30px / 1.12, Crimson Pro 600 |
| Editorial body | 15.5–17px / 1.5, Crimson Pro 400 |
| Mono label | 8–10px / 1, tracked, uppercase |

Mono labels below 8px are illegible — use 8.5px as the practical floor.

---

## 4. Layout

- Page gutter: 34px
- Header: 18px top / 16px bottom padding, 3px bone rule at the base (the wire)
- Content grid, landing: `1fr / 372px`
- Content grid, sport page: `1fr / 452px`
- Score row grid: `1fr 96px 1fr` — home right-aligned, score centered, away left-aligned
- Standings grid: `34px 1fr 26px 26px 26px 26px 34px 34px` (#, club, MP, W, D, L, GD, Pts)
- Row rhythm: 8–13px vertical padding, 1px hairline divider, no card borders inside lists

Always use flex/grid with `gap`. No margin-based spacing between siblings.

---

## 5. Components

**Header** — Wordmark, league nav (mono, active item underlined 2px signal), right-side utilities. Bottom border is the wire + dot.

**Live rail** — Slate band, 4-up grid of live game cards. Cards carrying a live game get a 3px signal left edge. Card head: dot + clock + league tag.

**Score row** — Three-column grid. Crest placeholder (26px, radius 4px, steel, 3-letter mono abbreviation) sits adjacent to the team name, on the outside of the score. Under the score: dot + state in mono. A live row gets `background: #151819` and a 3px signal left border.

**Fixtures list** — Grouped by day. Day header in mono signal, `.22em` tracking. No card wrapper.

**Standings table** — Mono header row, Fjalla values. Position + movement arrow in one cell. Qualification zones marked with a 2px signal left border on the row, explained in a legend below the table. Live/gameweek toggle as a 2-segment control, active segment filled signal with ink text.

**Wireroom block** — Bone ground. Head: 7px signal square + `WIREROOM` in mono `.28em` + assembly timestamp. Fjalla headline, Crimson Pro body, source chips (mono, 1px border, no fill). Disputed items are labeled `disputed` in the head rather than merged into a single claim.

**Column block** — Bone ground. Head: `COLUMN` in mono oxblood with an oxblood rule. Crimson Pro 600 headline, Crimson Pro body, italic byline. No Fjalla, no orange — the Column never borrows the data voice.

---

## 6. Content rules

- Team names uppercase, always. Use short forms (`Nottm Forest`, `C Palace`, `Spurs`).
- Times: 12-hour with meridiem, in mono. Football clock as `88'` / `90+4`.
- Wireroom always states source count and assembly time. Never publish a merged claim where sources conflict — flag it.
- Standings movement is relative to the previous gameweek, shown as `▲6` / `▼4`.

---

## 7. Open items

- Crests are grey mono placeholders; real assets needed.
- **Wireroom** is a working name for the AI section.
- Team pages: reuse header, tab bar, dot vocabulary, and standings grid. Not yet designed.
- Mobile breakpoints not yet defined. Score row will need to collapse to a stacked two-line layout.
- Fjalla One's single weight may become limiting in deep tables — a condensed fallback (Barlow Condensed) is the likeliest addition.

---

## Files

| File | Contents |
|---|---|
| `landing.html` | Cross-sport home: live rail, Wireroom, Column, slate rail |
| `premier-league.html` | Sport page: gameweek nav, fixtures, live standings, league Wireroom |
| `The Wire - Brand.dc.html` | Brand exploration — logo directions, color and type studies |
| `The Wire - App Screens.dc.html` | Source of the two screens above |
