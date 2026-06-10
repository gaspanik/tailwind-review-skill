# v3 → v4 Conversion Tables & Migration Procedure

Reference for Dimension 2 of tailwind-review. Read when detection hits are found or when migration mode was chosen in Step 0.5.

---

## Changes by Category

**[Changed behavior] Spacing / Division**

> ⚠️ These utilities are **NOT removed** in v4 — they still work. The selector implementation changed from `> :not([hidden]) ~ :not([hidden])` to `> :not(:last-child)`, which can change rendering when children are hidden or dynamically inserted. Converting to flex/grid + `gap-*` is this skill's recommendation, not a requirement — always explain the impact and let the user decide.

| v3 pattern | v4 recommendation |
|---|---|
| `space-x-*` | `flex` + `gap-*` |
| `space-y-*` | `flex flex-col` + `gap-*` |
| `divide-x` / `divide-y` | Still available; if the selector change causes issues, add borders to individual child elements |

**[Removed] Opacity utilities → slash syntax**
| v3 (removed) | v4 (recommended) |
|---|---|
| `bg-opacity-50` | `bg-black/50` |
| `text-opacity-50` | `text-black/50` |
| `border-opacity-50` | `border-black/50` |
| `divide-opacity-50` | `divide-black/50` |
| `ring-opacity-50` | `ring-black/50` |
| `placeholder-opacity-50` | `placeholder-black/50` |

**[Renamed] Flex utilities**
| v3 (old) | v4 (new) |
|---|---|
| `flex-shrink` / `flex-shrink-0` | `shrink` / `shrink-0` |
| `flex-grow` / `flex-grow-0` | `grow` / `grow-0` |

**[Renamed] Scale shift (⚠️ silently changes appearance)**

v4 adds `xs` to the scale, shifting all existing names up by one step.
These won't throw errors, making them easy to miss.

| v3 | v4 | Actual size |
|---|---|---|
| `shadow-sm` | `shadow-xs` | Small shadow |
| `shadow` (bare) | `shadow-sm` | Default shadow |
| `blur-sm` | `blur-xs` | Small blur |
| `blur` (bare) | `blur-sm` | Default blur |
| `drop-shadow-sm` | `drop-shadow-xs` | Small drop shadow |
| `drop-shadow` (bare) | `drop-shadow-sm` | Default drop shadow |
| `backdrop-blur-sm` | `backdrop-blur-xs` | Small backdrop blur |
| `backdrop-blur` (bare) | `backdrop-blur-sm` | Default backdrop blur |
| `rounded-sm` | `rounded-xs` | Small border radius |
| `rounded` (bare) | `rounded-sm` | Default border radius |

> **Detection tip:** Any use of `shadow`, `blur`, `rounded`, `drop-shadow`, or `backdrop-blur` without a suffix or with `-sm` is a scale-shift candidate. Confirm the project is on v4 before reporting.

**[Changed] Outline**
| v3 | v4 |
|---|---|
| `outline-none` | `outline-hidden` (renamed for accessibility clarity) |
| `outline outline-2` | `outline-2` (`outline` alone now sets 1px) |

**[Changed] !important modifier position**
| v3 | v4 |
|---|---|
| `!flex` `!bg-red-500` `hover:!bg-red-600` | `flex!` `bg-red-500!` `hover:bg-red-600!` |

**[Changed] CSS variable arbitrary value syntax**
| v3 | v4 |
|---|---|
| `bg-[--brand-color]` | `bg-(--brand-color)` |

**[Renamed] Gradient utilities**
| v3 (old) | v4 (new) |
|---|---|
| `bg-gradient-to-t` | `bg-linear-to-t` |
| `bg-gradient-to-tr` | `bg-linear-to-tr` |
| `bg-gradient-to-r` | `bg-linear-to-r` |
| `bg-gradient-to-br` | `bg-linear-to-br` |
| `bg-gradient-to-b` | `bg-linear-to-b` |
| `bg-gradient-to-bl` | `bg-linear-to-bl` |
| `bg-gradient-to-l` | `bg-linear-to-l` |
| `bg-gradient-to-tl` | `bg-linear-to-tl` |

**[Changed] Other**
| v3 | v4 |
|---|---|
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |

---

## Running Migration (only if "2. Migrate to v4" was chosen in Step 0.5)

Rewrite files rather than just reporting. Follow these steps:

**1. Build the conversion list**

Scan all target files, list every required change, and confirm with the user before applying:

```
The following conversions will be applied (X total):

  [1] line 12  space-y-4        → flex flex-col gap-4
  [2] line 18  flex-shrink-0    → shrink-0
  [3] line 24  shadow-sm        → shadow-xs
  [4] line 24  rounded          → rounded-sm
  [5] line 31  bg-opacity-50    → bg-black/50
  [6] line 45  outline-none     → outline-hidden

Proceed? (yes / exclude by number, e.g. "skip 3, 4")
```

**2. Apply with the Edit tool once approved**

Edit files directly. No need to confirm each change individually — confirm the list, then apply all at once.

**3. Conversions that require manual judgment (do not auto-apply)**

The following depend on context — present as suggestions and let the user decide:

- `space-y-*` / `space-x-*` → these still work in v4 (see [Changed behavior] above); conversion target depends on whether the parent already has `flex`, and keeping them may be acceptable
- `shadow` (bare) → confirm whether it was intentional in v3 or needs updating (requires design review)
- `!important` modifier (`!flex` → `flex!`) → high risk of bulk-replace errors if many instances exist

**4. Also suggest updating the CSS entry file**

The CSS syntax changes in v3 → v4 migrations. Check the file and suggest:

```
[Migration] src/style.css
  Current:
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  Fix:
    @import "tailwindcss";

Apply this change?
```
