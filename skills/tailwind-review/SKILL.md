---
name: tailwind-review
description: >
  Skill for reviewing, optimizing, and migrating Tailwind CSS code, including HTML accessibility checks.
  Always use this skill when:
  · Asked to "review", "clean up", "check", or "look at" Tailwind classes
  · v3 classes like `space-y-*`, `space-x-*`, `flex-shrink`, `shadow-sm`, `bg-opacity-*` are present
  · Hardcoded arbitrary values like `text-[#1e40af]` or `w-[320px]` are used
  · Conflicting or redundant classes like `flex` and `block` on the same element are found
  · Asked whether to use `cn()` / `clsx`, or whether to consolidate with `*:` variants
  · Asked to migrate or rewrite from v3 to v4
  · Asked to check HTML accessibility structure: `aria-label`, `ul/li`, `button type`, `label`, etc.
  · Asked to review `.html`, `.tsx`, `.jsx`, `.vue`, or `.astro` files (if Tailwind is used)
  Framework-agnostic (HTML / React / Vue / Svelte / Astro, etc.).
  Also use for vague requests like "something looks off with the classes", "the design changed after upgrading to v4", or "migrating from CSS modules".
---

# Tailwind CSS Code Review & Optimization Skill

## Overview

This skill reviews Tailwind CSS code across 5 dimensions and provides improvement suggestions or applies automatic fixes.

---

## Opening Message

Before starting the review, always display the following message to the user:

```
> **Note:** If auto-fixes will be applied, make sure you can revert the changes.
> If you're using Git, run `git status` to check for uncommitted changes.
> Consider running `git stash` or `git commit` before proceeding if you have unsaved work.
```

After displaying this message, proceed immediately to Step 0 — do not wait for a response.

---

## How to Run the Review

### Step 0: Detect Design System Definitions

Before reviewing, check whether a **`DESIGN.md`** exists in the project root.
This file may define the project's design tokens (colors, typography, spacing) and takes the highest priority in Dimension 3 suggestions.

Check whether `DESIGN.md` exists — look in the project root, then `docs/`, then `.design/`.

**If found:**
- Read the full file
- Extract defined tokens: color names/values, font families, spacing scale, type scale
- Store them as **Priority 1** references for Dimension 3 (see priority order below)
- Display a brief notice to the user:

```
DESIGN.md found — design tokens defined there will be used as the primary reference for suggestions.
```

**If not found:** proceed without it. `@theme` variables and the built-in Tailwind scale serve as fallbacks.

---

### Step 0.5: Detect Tailwind Version

Before starting, detect the project's Tailwind version.
This determines how Dimension 2 (v3→v4 migration check) is handled.

**Detection steps (check in order, stop at first match):**

1. Check the `"tailwindcss"` entry in `package.json` for the version
2. Check whether `tailwind.config.js` exists in the project root
3. Search for CSS files under `src/` containing `@tailwind` or `@import "tailwindcss"`

**Decision criteria:**

| Detection result | Verdict |
|---|---|
| `"tailwindcss": "^3.*"` or `"tailwindcss": "3.*"` | **v3** |
| `"tailwindcss": "^4.*"` or `"tailwindcss": "4.*"` | **v4** |
| `tailwind.config.js` exists | Likely **v3** |
| CSS contains `@tailwind base;` | **v3** |
| CSS contains `@import "tailwindcss";` | **v4** |
| Cannot determine | **Unknown** (see below) |

---

**If v3 is detected → ask via `AskUserQuestion`:**

> "Tailwind CSS v3 detected. How would you like to proceed?"
>
> 1. Review only — report issues without rewriting
> 2. Migrate to v4 — rewrite to v4 syntax

- **Option 1 (Review only):** Dimension 2 reports issues in v3 code only. No rewrites.
- **Option 2 (Migration):** Apply all conversions from the Dimension 2 table and rewrite the files.

---

**If v4 is detected:**
Dimension 2 checks for any v3 patterns that may have slipped in.
If v3 patterns are found in a v4 project, report them as bugs.

---

**If unknown → ask via `AskUserQuestion`:**

> "Could not determine the Tailwind version. Which are you using?"
>
> 1. v4
> 2. v3

---

### Step 1: Identify Target Files

If no files are specified, search the project for HTML / JSX / TSX / Vue / Svelte files containing Tailwind classes.

Enumerate `.html` / `.tsx` / `.jsx` / `.vue` / `.astro` files containing `class=` across the project (excluding `node_modules` / `dist`).

### Step 1.5: Confirm Review Scope (HTML files only)

Only applies to `.html` files.
Skip this step for component files like `.tsx` / `.jsx` / `.vue` — they're already small units.

**Read the file and assess its size:**
- 80+ lines, or 3+ `<section>` / `id`-bearing `<div>` elements → ask about scope
- Smaller files → review the whole file without asking

**If scope confirmation is needed, auto-detect sections and present them:**

Detect section boundaries in this priority order:
1. `<section>` tags (use `id` or `aria-label` value if present)
2. Top-level `<div id="...">` blocks
3. `<!-- ... -->` comment-delimited blocks
4. Semantic elements: `<header>` / `<main>` / `<footer>` / `<nav>`

Output the section list as plain text first, then use `AskUserQuestion` to ask the user which range to review.

**Text output example (must appear before AskUserQuestion):**

```
This file is 320 lines. The following sections were detected:

  1. <header>            — Navigation (lines 1–30)
  2. #hero               — Hero section (lines 31–80)
  3. #features           — Features (lines 81–150)
  4. #pricing            — Pricing plans (lines 151–230)
  5. <footer>            — Footer (lines 231–320)
```

**Use `AskUserQuestion` to select scope (max 4 options):**

`AskUserQuestion` accepts a maximum of 4 options. Always use exactly these 4:

```
1. All (recommended)  — Review the entire page
2. First half         — Top sections
3. Second half        — Bottom sections
4. Specify by number  — User will type section numbers
```

If "Specify by number" is selected, ask the user to type the numbers in the next message.
Load only the selected sections and review them.
If "All" is selected, review the entire file.

### Step 2: Review Across 5 Dimensions

Check **all** dimensions. Report any findings, even a single one.

---

## Dimension 1: Class Redundancy Check

Detect **conflicting classes** or **meaningless duplicates** on the same element.

**Common patterns:**
- Layout conflicts: `block` and `flex` together, `hidden` and `flex` together
- Direction conflicts: `flex-row` and `flex-col` together
- Size duplicates: `w-full` and `w-1/2` together
- Display duplicates: `inline-block` and `block` together

**Report format:**
```
[Redundancy] <filename>:<line>
  Issue: `flex` and `block` are both specified
  Current: class="flex block px-4"
  Fix:     class="flex px-4"  # remove `block` — `flex` already sets display
```

### Shared Class Detection (`*:` variant suggestion)

If **all (or most) direct children of a parent element share the same classes**,
suggest consolidating them onto the parent using the `*:` variant.

**Detection conditions:**
- 3 or more sibling elements share the same parent
- The majority share **2 or more** common classes

Typical patterns: nav links, list items, footer columns.

**Report format:**
```
[Shared Classes] <filename>:<line>
  Issue: 3 <a> elements all have "text-gray-800 hover:text-blue-600"
  Current:
    <ul>
      <li><a class="text-gray-800 hover:text-blue-600">Home</a></li>
      <li><a class="text-gray-800 hover:text-blue-600">About</a></li>
      <li><a class="text-gray-800 hover:text-blue-600">Contact</a></li>
    </ul>
  Suggestion:
    <ul class="*:text-gray-800 *:hover:text-blue-600">
      <li><a>Home</a></li>
      <li><a>About</a></li>
      <li><a>Contact</a></li>
    </ul>
  Benefit: Classes are managed in one place — design changes require only one edit
```

**Notes:**
- If some children have different classes (e.g., an active link with `text-blue-600`),
  move only the shared classes to the parent and leave the differences on the children:
  ```html
  <ul class="*:text-gray-800 *:transition-colors">
    <li><a>Home</a></li>
    <li><a class="text-blue-600">About (current)</a></li>  ← keep the diff
    <li><a>Contact</a></li>
  </ul>
  ```
- `*:` applies to **direct children only** (not grandchildren) — mention this if nesting could cause unexpected scope.
- Available in Tailwind v3.1+ / v4. Do not suggest in older v3 projects.

### cn() / Class Merge Function Suggestion (React / TSX / Astro)

For `.tsx` / `.jsx` / `.astro` files, also check whether a **class merge function** is in use.
Skip this check for HTML and Vue files.

**Step 1: Check adoption status**

```bash
# Check if clsx / tailwind-merge / class-variance-authority are in package.json
grep -E '"clsx"|"tailwind-merge"|"class-variance-authority"' package.json

# Check if cn() / clsx() are already used in code
grep -r "cn(" --include="*.tsx" --include="*.ts" --include="*.astro" src/ | grep -v "node_modules" | head -5
grep -r "clsx(" --include="*.tsx" --include="*.ts" --include="*.astro" src/ | grep -v "node_modules" | head -5
```

**Step 2: Respond based on status**

**Pattern A: Not installed (absent from both package.json and code)**

If 1+ redundancy issues were found, append this to the review results:

```
💡 Suggestion: Introduce a class merge function

This project does not use cn() / clsx or similar utilities.
In Tailwind, when multiple classes target the same property, the last one wins —
but this can lead to unintended overrides. Consider adding a merge function.

Recommended setup (shadcn/ui style):
  # Detect your package manager from the lockfile:
  #   package-lock.json → npm install
  #   yarn.lock         → yarn add
  #   pnpm-lock.yaml    → pnpm add
  #   bun.lockb         → bun add
  <pm> add clsx tailwind-merge

  // src/lib/utils.ts
  import { clsx, type ClassValue } from "clsx"
  import { twMerge } from "tailwind-merge"

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }

Usage:
  // Safely build classes with conditionals
  <div className={cn("flex px-4", isActive && "bg-blue-600", className)}>

  // Safely merge internal classes with className props
  <button className={cn("rounded px-4 py-2", props.className)}>
```

**Pattern B: Installed but not used where redundancy was found**

```
[Redundancy] <filename>:<line>
  Issue: `flex` and `block` are both specified
  Current: <div className="flex block px-4">
  Fix:     <div className="flex px-4">
  Note: cn() is already set up in this project.
        Use it to safely merge className props:
        <div className={cn("flex px-4", props.className)}>
```

**Pattern C: Installed and used correctly**

No report needed. Report any redundancy issues normally if found.

---

## Dimension 2: v3 → v4 Migration Check

Detect v3-era classes that are removed, renamed, or behave differently in Tailwind CSS v4, and suggest v4 replacements.

### Change categories (overview)

Full conversion tables are in **`references/v3-to-v4.md`** (in this skill's directory) — **read it when any detection hits are found**, or when migration mode was chosen in Step 0.5.

- **[Changed behavior]** `space-x/y-*`, `divide-x/y` — **still available in v4** (not removed); the selector implementation changed, which can affect rendering. Converting to flex/grid + `gap-*` is a recommendation, not a requirement
- **[Removed]** opacity utilities — `bg-opacity-50` → slash syntax `bg-black/50` (same for text / border / divide / ring / placeholder)
- **[Renamed]** `flex-shrink` / `flex-grow` → `shrink` / `grow`
- **[Renamed]** scale shift — `shadow-sm` → `shadow-xs`, bare `shadow` → `shadow-sm`; same for blur / rounded / drop-shadow / backdrop-blur (⚠️ silently changes appearance)
- **[Changed]** `outline-none` → `outline-hidden`; `!important` position `!flex` → `flex!`; CSS variable syntax `bg-[--var]` → `bg-(--var)`
- **[Renamed]** gradients — `bg-gradient-to-*` → `bg-linear-to-*`
- **[Changed]** `overflow-ellipsis` → `text-ellipsis`; `decoration-slice/clone` → `box-decoration-slice/clone`

---

### Detection

```bash
# Grep for deprecated classes in bulk
grep -rn \
  -e "space-x-" -e "space-y-" \
  -e "flex-shrink" -e "flex-grow" \
  -e "bg-opacity-" -e "text-opacity-" -e "border-opacity-" \
  -e "ring-opacity-" -e "divide-opacity-" -e "placeholder-opacity-" \
  -e "overflow-ellipsis" -e "outline-none" \
  -e "bg-gradient-to-" \
  -e "\!flex\b" -e "\!block\b" -e "\!hidden\b" \
  --include="*.html" --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.astro" \
  . | grep -v "node_modules" | grep -v "dist"
```

For scale shifts (shadow/blur/rounded), grep for `shadow\b`, `blur\b`, `rounded\b`, `shadow-sm\b`, etc. and visually inspect.

---

### Report Format

```
[v4 Migration] <filename>:<line>
  Issue: `shadow-sm` is renamed to `shadow-xs` in v4 (scale shift)
  Current: class="shadow-sm rounded px-4"
  Fix:     class="shadow-xs rounded-sm px-4"
  Note: Also check for shadow (bare) → shadow-sm and rounded (bare) → rounded-sm
```

---

### Running Migration (only if "2. Migrate to v4" was chosen in Step 0.5)

Read **`references/v3-to-v4.md`** and follow its "Running Migration" procedure: build the full conversion list, confirm with the user, apply with the Edit tool in bulk, handle the manual-judgment cases (`space-x/y`, bare `shadow`, `!important`) as suggestions only, and propose the CSS entry file update (`@tailwind base;` → `@import "tailwindcss";`).

---

## Dimension 3: Design Token Usage Check

Detect **arbitrary values** and suggest replacing them with `@theme` variables or standard Tailwind scale values.

This dimension is especially important for code generated by **Figma MCP**, which tends to reproduce exact Figma measurements as arbitrary values rather than using the Tailwind scale.

**Examples of arbitrary values:**
- `text-[#294779]` → `text-primary` (if `--color-primary: #294779` exists in `@theme`)
- `bg-[#1a1a1a]` → `bg-dark`
- `w-[320px]` → `w-80` (if representable in the Tailwind scale)
- `font-[600]` → `font-semibold`

### Reference Priority Order

When suggesting a replacement for an arbitrary value, always consult references in this order and stop at the first match:

| Priority | Source | How to use |
|---|---|---|
| **1** | `DESIGN.md` | Token names and values defined by the project team. Use these as-is. |
| **2** | `@theme` in CSS entry file | CSS custom properties (`--color-*`, `--font-*`, etc.) compiled into Tailwind utilities |
| **3** | Built-in Tailwind scale | Standard utilities (`text-base`, `gray-700`, `font-semibold`, etc.) via 3-B / 3-C tables |
| **4** | Keep as arbitrary | No match found — keep the value and note it for design system definition |

When the suggestion comes from `DESIGN.md`, include that source in the report:

```
[Token] <filename>:<line>
  Issue: Hardcoded color `[#1a3a5c]` matches a token defined in DESIGN.md
  Current: class="text-[#1a3a5c]"
  Fix:     class="text-brand-dark"  # defined in DESIGN.md as brand-dark: #1a3a5c
```

**Steps:**
1. Check `DESIGN.md` tokens (loaded in Step 0) — exact match first
2. Read the `@theme` block in `src/style.css` (or `globals.css`, etc.) — match against CSS variables
3. If no match in 1 or 2, check the built-in Tailwind scale tables (3-B / 3-C) below
4. If no match anywhere, flag as "no design token defined" and suggest defining one

**Report format:**
```
[Token] <filename>:<line>
  Issue: Hardcoded color value `[#294779]`
  Current: class="text-[#294779]"
  Suggestion: class="text-primary"  # --color-primary: #294779 is defined in style.css
```

Actively suggest scale conversions:
```
[Token] <filename>:<line>
  Issue: w-[320px] can be expressed as w-80 (320px)
  Current: class="w-[320px]"
  Fix:     class="w-80"
```

---

### 3-A: Font Family Arbitrary Value Detection

Figma MCP often writes font names directly as arbitrary values. Detect these patterns and suggest defining them in `@theme` or using a standard utility.

**Detection targets:**
- `font-['Inter',_sans-serif]`
- `font-['Noto_Sans_JP']`
- `font-[Inter]`
- Any `font-[` that contains a string (not a number)

**Steps:**
1. Grep for `font-\[` in target files
2. For each match, check whether a matching `--font-*` variable exists in `@theme`
3. Check whether the font can map to a built-in utility (`font-sans`, `font-serif`, `font-mono`)

**Report format — theme variable missing:**
```
[Token] <filename>:<line>
  Issue: Font family written as arbitrary value `font-['Inter',_sans-serif]`
  Current: class="font-['Inter',_sans-serif]"
  Suggestion:
    1. Define in @theme:
         @theme {
           --font-sans: 'Inter', sans-serif;
         }
       Then use: class="font-sans"

    2. Or map to a built-in: font-sans / font-serif / font-mono
       (Confirm the intended typeface before substituting)
```

**Report format — theme variable already exists:**
```
[Token] <filename>:<line>
  Issue: Font family written as arbitrary value `font-['Inter',_sans-serif]`
  Current: class="font-['Inter',_sans-serif]"
  Fix:     class="font-sans"  # --font-sans: 'Inter', sans-serif is defined in style.css
```

---

### 3-B: Pixel / Unit Scale Mapping

When arbitrary px / em / rem values are found, read **`references/scale-tables.md`** (in this skill's directory) for the full conversion tables — font size, line height, letter spacing, font weight, and spacing/sizing — and suggest the closest scale utility. If the value falls between steps, mention both neighbours and ask the user to confirm.

> **Tip:** Tailwind spacing scale follows `1 unit = 4px`. Divide px by 4 — a whole number means a standard utility exists; otherwise keep the arbitrary value. For obvious cases like this, the table lookup can be skipped.

**Report format:**
```
[Token] <filename>:<line>
  Issue: text-[16px] can be expressed as text-base (16px / 1rem)
  Current: class="text-[16px] leading-[1.5] tracking-[0.05em]"
  Fix:     class="text-base leading-normal tracking-wider"
```

---

### 3-C: Built-in Tailwind Color Matching

Even when no `@theme` variables are defined, compare hardcoded hex / rgb color values against the **Tailwind built-in color palette** and suggest the closest match.

**Coverage:** `text-[*]`, `bg-[*]`, `border-[*]`, `ring-[*]`, `fill-[*]`, `stroke-[*]`, `shadow-[*]`, `divide-[*]`, `outline-[*]`

**Matching approach:**
1. Extract the hex value from the arbitrary class
2. Read **`references/color-table.md`** (in this skill's directory) and compare (exact match first, then nearest by hex distance)
3. If the match is approximate, flag it with "(approximate)" and ask the user to confirm visually

**Report format — exact match:**
```
[Token] <filename>:<line>
  Issue: Hardcoded color `[#374151]` matches a built-in Tailwind color
  Current: class="text-[#374151]"
  Fix:     class="text-gray-700"
```

**Report format — approximate match:**
```
[Token] <filename>:<line>
  Issue: `[#3a4050]` is close to gray-700 (#374151) — please confirm visually
  Current: class="text-[#3a4050]"
  Suggestion: class="text-gray-700"  ← approximate; verify before applying
```

---

### 3-D: Simplifiable Arbitrary Values (v4)

In Tailwind v4, certain arbitrary values can be written as native utilities without brackets.
Detect these and suggest the shorter form. This avoids linter warnings (e.g. Biome) and improves readability.

**Detection targets and conversions:**

| Pattern | Example | Fix |
|---|---|---|
| `aspect-[N/M]` | `aspect-[16/7]` | `aspect-16/7` |
| `aspect-[N/M]` | `aspect-[4/3]` | `aspect-4/3` |
| `w-[N/M]` | `w-[1/2]` | `w-1/2` |
| `w-[N/M]` | `w-[2/3]` | `w-2/3` |

Only apply `w-[N/M]` → `w-N/M` when both N and M are plain integers (standard Tailwind fraction utilities). Keep other `w-[*]` arbitrary values as-is (e.g. `w-[320px]`, `w-[calc(...)]`).

**Detection:**

```bash
grep -rn -e "aspect-\[" -e "w-\[[0-9]" --include="*.html" --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.astro" . | grep -v "node_modules" | grep -v "dist"
```

> **Note:** Only simplify `N/M` ratio patterns inside brackets. Keep all other arbitrary values as-is.

**Report format:**
```
[Simplify] <filename>:<line>
  Issue: `aspect-[16/7]` can be written as `aspect-16/7` in Tailwind v4
  Current: class="... aspect-[16/7] ..."
  Fix:     class="... aspect-16/7 ..."

[Simplify] <filename>:<line>
  Issue: `w-[1/2]` can be written as `w-1/2`
  Current: class="... w-[1/2] ..."
  Fix:     class="... w-1/2 ..."
```

---

### 3-E: `text-xs` without `leading-tight`

`text-xs` is very small (12px / 0.75rem). Without an explicit line-height, browsers apply `leading-normal` (1.5), which leaves too much space between lines at that size. `leading-tight` (1.25) fits better.

**Detection:** find `text-xs` that is **not** accompanied by any `leading-*` class on the same element.

```bash
grep -rn "text-xs" --include="*.html" --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.astro" . | grep -v "node_modules" | grep -v "dist"
```

Then filter results where no `leading-` class is present on the same element.

**Report format (suggestion only — do not auto-apply):**
```
[Typography] <filename>:<line>
  Suggestion: `text-xs` without `leading-*` — consider adding `leading-tight`
  Current: class="text-xs text-gray-500"
  Suggested: class="text-xs leading-tight text-gray-500"
```

> This is a suggestion, not a required fix. Skip if the element already has a `leading-*` class, or if the design intentionally uses looser spacing.

---

## Dimension 4: Accessibility Check (Tailwind)

Check whether visual styling choices harm accessibility.

**Key checks:**

**Uppercase text:**
Detect text written directly in uppercase in HTML. Screen readers may read each letter individually.
Use the `uppercase` class to apply uppercase visually instead.

```
[a11y] <filename>:<line>
  Issue: Text is written in uppercase directly in HTML
  Current: <a href="#about">ABOUT</a>
  Fix:     <a href="#about" class="uppercase">About</a>
```

**Contrast concerns (visual check only):**
Warn when light gray text (`text-gray-300`, `text-gray-400`, etc.) is used on white or light backgrounds.
Do not auto-detect — raise awareness only.

```
[a11y] <filename>:<line>
  Warning: `text-gray-300` may have insufficient contrast on a white background
  Action: Verify it meets WCAG AA contrast ratio (4.5:1)
```

**Form accessibility:**
Check whether `hidden` is used instead of `sr-only` to visually hide labels for inputs or buttons.

---

## Dimension 5: HTML Structure Accessibility Check

Check whether HTML element semantics, structure, and ARIA attributes are correct — independent of Tailwind classes.
Issues are most common in navigation, forms, and interactive elements.

**Key checks:**

**Navigation:**
- `<nav>` missing `aria-label` (required if multiple navs exist; helpful even with one)
- Active links missing `aria-current="page"`
- Nav link lists not wrapped in `<ul><li>` (screen readers can't announce list item count)

```
[HTML a11y] <filename>:<line>
  Issue: <nav> has no aria-label
  Current: <nav class="flex ...">
  Fix:     <nav aria-label="Main navigation" class="flex ...">
```

**Buttons and links:**
- `<button>` missing `type` attribute (inside a form, it defaults to `type="submit"` and may trigger unintended submission)
- `<a>` used for actions rather than navigation → should be `<button>`
- `<a href="#">` with no `role="button"` and no meaningful `href`

```
[HTML a11y] <filename>:<line>
  Issue: <button> has no type attribute
  Current: <button class="bg-blue-600 ...">LOGIN</button>
  Fix:     <button type="button" class="bg-blue-600 ...">Login</button>
```

**Images:**
- `<img>` missing `alt` attribute, or empty string (empty `alt=""` is correct for decorative images; meaningful images need a description)

**Forms:**
- `<input>` has no associated `<label>` (no `id` / `for` binding)
- `<input type="text">` uses only `placeholder` with no `<label>` (placeholder is not a substitute for a label)

```
[HTML a11y] <filename>:<line>
  Issue: <input> has no associated <label>
  Current: <input type="email" placeholder="your@email.com" class="...">
  Fix:     <label for="email">Email address</label>
           <input id="email" type="email" placeholder="your@email.com" class="...">
```

**Heading hierarchy:**
- Multiple `<h1>` elements, or heading levels that skip (e.g., going from `<h1>` straight to `<h3>`)

---

## Step 3: Summary

After all dimensions are checked, present results in this format:

```
## Tailwind CSS Review Results

### Summary
| Dimension | Count |
|-----------|-------|
| Class redundancy | X |
| v4 migration | X |
| Design tokens | X |
| Accessibility (Tailwind) | X |
| HTML structure a11y | X |
| **Total** | **X** |

### Details
(list findings from each dimension)

### Apply Fixes
Would you like to apply auto-fixable items (redundancy, v4 migration, scale conversions)?
```

## Applying Fixes

- If the user explicitly says "fix it" or "apply it" → edit files directly
- If review only → present suggestions and ask for confirmation
- If partial fixes → confirm which items to apply before proceeding

---

## Notes

- **Framework-agnostic**: Both `class=` (HTML/Vue/Astro) and `className=` (React) are in scope
- **Custom classes**: Classes defined via `@apply` are not Tailwind utilities and are excluded from redundancy checks
- **Context matters**: `space-y-*` still works in v4 and may be intentional — recommend converting to `gap-*` but explain the impact and let the user decide
- **Missing `@theme`**: If no theme file is found, report it and skip the design token check
