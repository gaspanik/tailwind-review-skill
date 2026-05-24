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

### Step 0: Detect Design System Definitions

Before reviewing, check whether a **`DESIGN.md`** exists in the project root.
This file may define the project's design tokens (colors, typography, spacing) and takes the highest priority in Dimension 3 suggestions.

```bash
# Check for DESIGN.md in common locations
ls DESIGN.md 2>/dev/null || ls docs/DESIGN.md 2>/dev/null || ls .design/DESIGN.md 2>/dev/null
```

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

### Running Migration (only if "2. Migrate to v4" was chosen in Step 0.5)

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

Use the tables below to convert arbitrary px / em / rem values into Tailwind scale utilities.
Suggest the closest match. If the value falls between steps, mention both neighbours and ask the user to confirm.

**Font size (`text-[*]`)**

| Arbitrary | Tailwind utility | Actual size |
|---|---|---|
| `text-[10px]` | `text-xs` | 0.75rem / 12px |
| `text-[12px]` | `text-xs` | 0.75rem / 12px |
| `text-[14px]` | `text-sm` | 0.875rem / 14px |
| `text-[16px]` | `text-base` | 1rem / 16px |
| `text-[18px]` | `text-lg` | 1.125rem / 18px |
| `text-[20px]` | `text-xl` | 1.25rem / 20px |
| `text-[24px]` | `text-2xl` | 1.5rem / 24px |
| `text-[30px]` | `text-3xl` | 1.875rem / 30px |
| `text-[36px]` | `text-4xl` | 2.25rem / 36px |
| `text-[48px]` | `text-5xl` | 3rem / 48px |
| `text-[60px]` | `text-6xl` | 3.75rem / 60px |
| `text-[72px]` | `text-7xl` | 4.5rem / 72px |

**Line height (`leading-[*]`)**

| Arbitrary | Tailwind utility | Value |
|---|---|---|
| `leading-[1]` | `leading-none` | 1 |
| `leading-[1.25]` | `leading-tight` | 1.25 |
| `leading-[1.375]` | `leading-snug` | 1.375 |
| `leading-[1.5]` | `leading-normal` | 1.5 |
| `leading-[1.625]` | `leading-relaxed` | 1.625 |
| `leading-[2]` | `leading-loose` | 2 |

**Letter spacing (`tracking-[*]`)**

| Arbitrary | Tailwind utility | Value |
|---|---|---|
| `tracking-[-0.05em]` | `tracking-tighter` | -0.05em |
| `tracking-[-0.025em]` | `tracking-tight` | -0.025em |
| `tracking-[0em]` | `tracking-normal` | 0em |
| `tracking-[0.025em]` | `tracking-wide` | 0.025em |
| `tracking-[0.05em]` | `tracking-wider` | 0.05em |
| `tracking-[0.1em]` | `tracking-widest` | 0.1em |

**Font weight (`font-[*]`)**

| Arbitrary | Tailwind utility |
|---|---|
| `font-[100]` | `font-thin` |
| `font-[200]` | `font-extralight` |
| `font-[300]` | `font-light` |
| `font-[400]` | `font-normal` |
| `font-[500]` | `font-medium` |
| `font-[600]` | `font-semibold` |
| `font-[700]` | `font-bold` |
| `font-[800]` | `font-extrabold` |
| `font-[900]` | `font-black` |

**Spacing / sizing — common values (`w-[*]`, `h-[*]`, `p-[*]`, `m-[*]`, `gap-[*]`, etc.)**

| px value | Tailwind scale | rem |
|---|---|---|
| 4px | `1` | 0.25rem |
| 8px | `2` | 0.5rem |
| 12px | `3` | 0.75rem |
| 16px | `4` | 1rem |
| 20px | `5` | 1.25rem |
| 24px | `6` | 1.5rem |
| 32px | `8` | 2rem |
| 40px | `10` | 2.5rem |
| 48px | `12` | 3rem |
| 64px | `16` | 4rem |
| 80px | `20` | 5rem |
| 96px | `24` | 6rem |
| 128px | `32` | 8rem |
| 160px | `40` | 10rem |
| 192px | `48` | 12rem |
| 224px | `56` | 14rem |
| 256px | `64` | 16rem |
| 288px | `72` | 18rem |
| 320px | `80` | 20rem |
| 384px | `96` | 24rem |

> **Tip:** Tailwind spacing scale follows `1 unit = 4px`. Divide px by 4 to get the scale number.
> If the result is a whole number, a standard utility exists. If not, keep the arbitrary value.

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
2. Compare against the reference table below (exact match first, then nearest by hex distance)
3. If the match is approximate, flag it with "(approximate)" and ask the user to confirm visually

**Common Tailwind color reference (hex → utility)**

| Hex | Utility |
|---|---|
| `#f9fafb` | `gray-50` |
| `#f3f4f6` | `gray-100` |
| `#e5e7eb` | `gray-200` |
| `#d1d5db` | `gray-300` |
| `#9ca3af` | `gray-400` |
| `#6b7280` | `gray-500` |
| `#4b5563` | `gray-600` |
| `#374151` | `gray-700` |
| `#1f2937` | `gray-800` |
| `#111827` | `gray-900` |
| `#eff6ff` | `blue-50` |
| `#dbeafe` | `blue-100` |
| `#bfdbfe` | `blue-200` |
| `#93c5fd` | `blue-300` |
| `#60a5fa` | `blue-400` |
| `#3b82f6` | `blue-500` |
| `#2563eb` | `blue-600` |
| `#1d4ed8` | `blue-700` |
| `#1e40af` | `blue-800` |
| `#1e3a8a` | `blue-900` |
| `#fef2f2` | `red-50` |
| `#fee2e2` | `red-100` |
| `#fca5a5` | `red-300` |
| `#f87171` | `red-400` |
| `#ef4444` | `red-500` |
| `#dc2626` | `red-600` |
| `#b91c1c` | `red-700` |
| `#f0fdf4` | `green-50` |
| `#dcfce7` | `green-100` |
| `#86efac` | `green-300` |
| `#4ade80` | `green-400` |
| `#22c55e` | `green-500` |
| `#16a34a` | `green-600` |
| `#15803d` | `green-700` |
| `#fefce8` | `yellow-50` |
| `#fef9c3` | `yellow-100` |
| `#fde047` | `yellow-300` |
| `#facc15` | `yellow-400` |
| `#eab308` | `yellow-500` |
| `#ca8a04` | `yellow-600` |
| `#ffffff` | `white` |
| `#000000` | `black` |
| `transparent` | `transparent` |

> For colors not in the table, use the closest match by visual hex proximity and mark it as approximate.
> Note: Tailwind v4 includes an extended palette (slate, zinc, stone, sky, indigo, violet, purple, fuchsia, pink, rose, emerald, teal, cyan, lime, amber, orange) — apply the same matching logic for those.

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
