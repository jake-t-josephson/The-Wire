# The Wire — brand assets

The W mark: Fjalla One's W, traced to an outlined path, with the wire passing behind it and terminating in the signal dot. Full construction spec in `../DESIGN.md` section 8.

## Drop-in `<head>`

```html
<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
<link rel="manifest" href="/brand/site.webmanifest">
<meta name="theme-color" content="#0E0F10">
```

## Which file

| Context | File |
|---|---|
| Browser tab, anywhere SVG works | `favicon.svg` |
| Older browsers | `favicon-32.png` |
| iOS home screen | `apple-touch-icon.png` |
| Android / PWA | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| App store submission | `icon-1024.png` |
| Light backgrounds | `icon-light.svg`, `icon-light-512.png` |
| Orange fill (stickers, merch, accents) | `icon-signal.svg`, `icon-signal-512.png` |
| Single-color print, embossing, foil | `icon-mono.svg`, `icon-mono-512.png` |
| Inline in HTML, inheriting text color | `logo-w-mark.svg` |
| Bare letter, no tile | `w-glyph.svg` |

## Rules

- **Ground-dependent fills.** The W's halo stroke and the dot's ring both take the surrounding ground color. On a ground not covered above, copy `logo-w-mark.svg` and set `--wire-ground`.
- **The dot is the only color.** Never tint the W or the wire.
- **Not in the app header.** The header's bottom rule is already a wire ending in a dot. Wordmark alone there.
- **Clear space:** 8% of tile width on all sides when placing the tile against other elements.
- Minimum size 16px. Below that use `w-glyph.svg` on a plain ground.
