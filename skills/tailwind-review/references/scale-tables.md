# Pixel / Unit → Tailwind Scale Conversion Tables

Reference for Dimension 3-B of tailwind-review. Read when arbitrary px / em / rem values are found.

Suggest the closest match. If the value falls between steps, mention both neighbours and ask the user to confirm.

---

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
