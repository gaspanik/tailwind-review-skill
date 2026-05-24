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
  · Asked to review `.html`, `.tsx`, `.jsx`, or `.vue` files (if Tailwind is used)
  Framework-agnostic (HTML / React / Vue / Svelte, etc.).
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

### Step 0: Detect Tailwind Version

Before starting, detect the project's Tailwind version.
This determines how Dimension 2 (v3→v4 migration check) is handled.

**Detection steps (check in order, stop at first match):**

```bash
# 1. Check version in package.json
cat package.json | grep '"tailwindcss"'

# 2. Check for tailwind.config.js (a v3 indicator)
ls tailwind.config.js 2>/dev/null && echo "found"

# 3. Check import style in CSS entry file
grep -r "@tailwind\|@import.*tailwindcss" src/ --include="*.css" | head -5
```

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

**If v3 is detected → present options to the user:**

```
Tailwind CSS v3 detected.

How would you like to proceed?

  1. Review only — report issues without rewriting
  2. Migrate to v4 — rewrite to v4 syntax

Which would you prefer? (1 / 2)
```

- **Option 1 (Review only):** Dimension 2 reports issues in v3 code only. No rewrites.
- **Option 2 (Migration):** Apply all conversions from the Dimension 2 table and rewrite the files.

---

**If v4 is detected:**
Dimension 2 checks for any v3 patterns that may have slipped in.
If v3 patterns are found in a v4 project, report them as bugs.

---

**If unknown:**
Ask the user:
```
Could not determine the Tailwind version.
Are you using v3 or v4?
```

---

### Step 1: Identify Target Files

If no files are specified, search the project for HTML / JSX / TSX / Vue / Svelte files containing Tailwind classes.

```bash
grep -rl "class=" . --include="*.html" --include="*.tsx" --include="*.jsx" --include="*.vue" | grep -v "node_modules" | grep -v "dist"
```

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

### cn() / Class Merge Function Suggestion (React / TSX only)

For `.tsx` / `.jsx` files, also check whether a **class merge function** is in use.
Skip this check for HTML and Vue files.

**Step 1: Check adoption status**

```bash
# Check if clsx / tailwind-merge / class-variance-authority are in package.json
grep -E '"clsx"|"tailwind-merge"|"class-variance-authority"' package.json

# Check if cn() / clsx() are already used in code
grep -r "cn(" --include="*.tsx" --include="*.ts" src/ | grep -v "node_modules" | head -5
grep -r "clsx(" --include="*.tsx" --include="*.ts" src/ | grep -v "node_modules" | head -5
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

Detect deprecated or renamed classes in Tailwind CSS v4 and suggest v4 replacements.

### Changes by Category

**[Removed] Spacing / Division**
| v3 (removed) | v4 (recommended) |
|---|---|
| `space-x-*` | `flex` + `gap-*` |
| `space-y-*` | `flex flex-col` + `gap-*` |
| `divide-x` / `divide-y` | Add borders to individual child elements |

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

**[Changed] Other**
| v3 | v4 |
|---|---|
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |

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
  -e "\!flex\b" -e "\!block\b" -e "\!hidden\b" \
  --include="*.html" --include="*.tsx" --include="*.jsx" --include="*.vue" \
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

### Running Migration (only if "2. Migrate to v4" was chosen in Step 0)

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

- `space-y-*` / `space-x-*` → conversion target depends on whether the parent already has `flex`
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

---

## Dimension 3: Design Token Usage Check

Detect **arbitrary values** and suggest replacing them with `@theme` variables from the project.

**Examples of arbitrary values:**
- `text-[#294779]` → `text-primary` (if `--color-primary: #294779` exists in `@theme`)
- `bg-[#1a1a1a]` → `bg-dark`
- `w-[320px]` → `w-80` (if representable in the Tailwind scale)
- `font-[600]` → `font-semibold`

**Steps:**
1. Read the `@theme` block in `src/style.css` (or `globals.css`, etc.)
2. Match arbitrary values against theme variable color codes
3. Suggest even approximate matches (prompt the user to confirm)

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

- **Framework-agnostic**: Both `class=` (HTML/Vue) and `className=` (React) are in scope
- **Custom classes**: Classes defined via `@apply` are not Tailwind utilities and are excluded from redundancy checks
- **Context matters**: Even `space-y-*` may be intentional — strongly recommend the v4 migration path but explain the impact
- **Missing `@theme`**: If no theme file is found, report it and skip the design token check
