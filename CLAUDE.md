# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The maintainer writes in Arabic — reply in Arabic. Code, comments, and this file stay in English.

## Commands

```bash
node serve.mjs                          # static dev server → http://localhost:3000
node tools/shot.mjs                     # screenshot desktop + mobile, report browser errors
node tools/shot.mjs --full              # + full-page shots
node tools/shot.mjs --at "#reels"       # + a tight shot of one element
node tools/shot.mjs --only mobile --tag hero-v2
```

There is no build, no bundler, no linter, and no test suite. `package.json` lists `puppeteer` but nothing
uses it — `tools/shot.mjs` drives Playwright instead and resolves it from any install on the machine.
Screenshots land in `.shots/` (gitignored).

**Headless caveat:** in headless Chromium `<video>` mounts and buffers (`readyState 4`, `paused false`)
but `currentTime` never advances. That is a headless media-pipeline artifact, **not** a broken reel.
To actually confirm playback, launch Playwright with `headless: false` and diff `currentTime` over a
couple of seconds.

## Required workflow for every change request

1. **Understand before touching.** Read the relevant part of `index.html` end to end. Sections are
   delimited by full-width `<!-- ═══ NAME ═══ -->` banners — find the banner, not a line number.
2. **Pick exactly one skill** and say which and why (routing table below). Do not stack skills.
3. **Edit.**
4. **Screenshot and verify.** Restart nothing — `serve.mjs` reads from disk. Run `tools/shot.mjs`
   (with `--at` on the section you touched), then actually `Read` the PNG. The script also prints
   console errors, page errors, and failed requests — a clean run means zero output there.
5. Report what changed, and paste anything the browser complained about.

### Skill routing

| Request | Skill |
|---|---|
| Redesign / upgrade an existing section | `redesign-existing-projects` |
| General UI, layout, hierarchy, spacing, a11y, responsive fixes | `impeccable` |
| "Make it look more expensive / premium" | `high-end-visual-design` |
| Micro-interactions, easing, hover/press feel | `emil-design-eng` |
| Naming a motion effect the user described vaguely | `animation-vocabulary` |
| New section that needs a visual reference first | `imagegen-frontend-web`, then `image-to-code` |
| Logo / identity / brand board work | `brandkit` |
| Copy, wording, asset swap, link fix, small bugfix | none — just do it |

Backend, n8n, and database skills never apply here. This is a static brand site: no server, no data
layer, no checkout.

## Architecture

Everything is `index.html` — markup, CSS, and JS in one file, served as-is. That is deliberate; do not
split it into partials, add a framework, or introduce a build step.

**Page order:** Header → Hero → قصتنا (Our Story) → MAZAJ banner → المنيو (menu categories) →
reel strip → فروعنا (branches) → footer → menu modal.

The page was rebuilt in August 2026 from the Claude Design component *Mazaj Cafe.dc.html* (design
project `01b42218-d3cf-49db-bedb-6894f402aad0`). If a redesign arrives from there again it ships as a
`.dc.html` with `<helmet>`, `{{ }}` bindings, `sc-if` / `sc-for` and a `DCLogic` class — none of that
runs here. Translate it to vanilla; do not ship the `support.js` runtime.

### Styling: one stylesheet, classes, no inline soup

**This changed with the rebuild.** The old page styled nearly everything with `style=""` attributes,
which forced `!important` on every media query. It does not any more:

- All styling lives in the single `<style>` block in `<head>`, addressed by class.
- Inline `style=""` survives in exactly one role: per-element `object-position` on photographs, where
  the crop is a property of that specific image and belongs next to it.
- Media queries therefore need **no** `!important`. If you find yourself reaching for it, something
  else is wrong.
- Breakpoints in use: `980px`, `760px`, `560px`.

### Design tokens

`:root` carries the palette, elevation, easing and the z-index scale; `:root[data-theme="dark"]`
overrides the surface and text tokens. Colours were measured from the brand's own creatives (the
extraction lives in `../mazaj-design-system/`):

`--mz-accent #C40709` · `--mz-surface #FBF7F4` · `--mz-ink #2E2E2E` · `--mz-olive #446904` ·
`--mz-sage #BDC19A` · `--mz-kraft #D38F4B` · `--mz-terracotta #AF3905` · `--mz-sky #88CBDE` ·
`--mz-petrol #25495C`

Use them; do not hardcode new hexes for brand colours. Shadows are **warm-based**
(`rgba(58,20,8,…)`, `rgba(120,10,6,…)`) — never neutral grey.

**Menu-card backgrounds are semantic, not decorative.** `.mc-savoury` sage, `.mc-spices` kraft,
`.mc-sweet` terracotta, `.mc-drinks` sky. Each carries its own text colours because the contrast pairs
differ per background. Do not recolour one without rechecking its text.

### Theme

Resolved by a small blocking script in `<head>` **before first paint** — it reads `localStorage`
(`mazaj-theme`), falls back to `prefers-color-scheme`, and stamps `data-theme` on `<html>`. The header
toggle flips the attribute and rewrites the label. Never move that script below the stylesheet or the
page will flash the wrong theme.

### Typography and bilingual rules

Arabic is **Cairo**, English is **Montserrat**. `<html lang="ar" dir="rtl">` — the page is Arabic-first,
so English runs are the exception and each one carries `lang="en"` plus the `.ltr` class.

- `.ltr` sets `direction: ltr` (so bidi does not reorder `badri.hania.eg` or `6th of October`) but keeps
  `text-align: right`, so a Latin kicker still lines up with the Arabic heading underneath it.
- `.num` is Montserrat 800 for figures; wrap them in `dir="ltr"` inside Arabic sentences.
- Prices, phone numbers and years use **Latin** digits, never Arabic-Indic — that matches the brand.
- Use logical properties (`padding-inline`, `inset-inline-start`) everywhere. Physical `left`/`right`
  only when the thing really is physical, e.g. a gradient direction.
- The file is UTF-8. The PowerShell console mangles Arabic on output; never judge Arabic text from a
  terminal dump — verify in a screenshot.

### The menu modal

The only stateful UI. Four `<button data-cat="…">` cards open `#modal`; `CATS` in the script is the
single source of truth for what each one contains.

- Adding a menu means adding one entry to `CATS[key].menus` — the fan maths reads the array length,
  there are no parallel arrays to keep in sync any more.
- `place()` spreads the cards: `off = i - (n-1)/2`, then translate `off*190px`, rotate `off*8deg`,
  scale down by `0.06` per step from centre. Cards start stacked at opacity 0.
- The fan needs **two** `requestAnimationFrame`s before applying the open transform. One frame is not
  enough — the browser collapses both states into a single recalc and nothing animates.
- Escape, the close button, and a backdrop click all close it; focus returns to the card that opened it.
- A `<noscript>` block lists all seven menu links for the JS-off case. Keep it in sync with `CATS`.

### The reel strip

The marquee between the menus and the branches. `#reel-track` is empty in the markup; the script fills it.

- **`REELS` is the only place video links live.** Each entry is `{ src, poster, alt }`. `src` must be a
  direct `.mp4`/`.webm` — an Instagram or TikTok *page* link is an embed and cannot autoplay muted
  inside a marquee. The files go in `videos/` (see `videos/README.md` for the ffmpeg recipe).
- **Three identical sets, one CSS keyframe.** The track lays down `SETS = 3` copies of `REELS`, and
  `@keyframes mz-marquee` shifts it `-33.3333%` — exactly one set, so the loop is seamless with no
  runtime measurement. If you change `SETS`, change the percentage to match (`-100/SETS %`).
- Tiles are `aspect-ratio: 9/16` off the `--reel-h` token (380px desktop, 260px mobile).
- **Nothing inside the track may be `loading="lazy"`.** The track is wider than the viewport, so lazy
  tiles past the edge never load and the strip shows gaps.
- **Per-tile playback**: an IntersectionObserver rooted on `#reels` mounts and plays only the tiles
  currently inside the strip and pauses the rest, plus everything on tab hide. 21 tiles decoding at
  once would melt a laptop.
- Paused videos abort their own range requests, which surfaces as `ERR_ABORTED` on media. That is
  normal — `tools/shot.mjs` filters it out, so don't re-add it as an error.
- A missing or undecodable file removes its own `<video>` and leaves the poster `<img>` showing, so the
  strip degrades to photographs instead of black rectangles.
- `prefers-reduced-motion` skips `<video>` entirely and renders posters only.
- `serve.mjs` implements HTTP Range for video types. Without a 206 response, playback stalls.

### Scroll reveal

`[data-reveal]` elements get `.reveal-armed` **from JS**, never from the stylesheet — a JS-off or
crawler visit must see the content, not an invisible page. A 4-second timer force-adds `.reveal-in`
in case the observer never fires. `[data-count]` figures count up once on intersection.

### Motion

`prefers-reduced-motion` is honoured globally in the `MOTION RESTRAINT` block, and again inside the
reveal and reel units in JS. Any new animation must survive that block being active.

## Traps

- **Asset paths must stay relative** (`instagram_images/...`, `menus_badriandhania/...`). The site is
  deployed to GitHub Pages under the `/mazaj-cafe-website/` subpath *and* to Vercel at root; a leading
  `/` breaks the Pages deploy. A previous commit exists purely to fix this.
- **Never use U+2212 MINUS SIGN (`−`) in SVG path data.** It silently invalidates the whole `d`
  attribute. The two torn-paper banner edges depend on ASCII hyphen-minus.
- **Gradients are physical, the page is not.** `linear-gradient(to left, …)` does not flip in RTL. The
  hero veil has to darken toward the *right*, because that is where the copy sits. Getting this
  backwards is exactly how the hero text ended up unreadable once already.
- **Menu cards are `<button>`s whose children are `<span>`s.** They need `display: block` or
  `aspect-ratio` and margins are silently dropped on the inline box.
- **`og:image` must stay an absolute URL** (relative ones are unreliable across crawlers), so it is
  pinned to the GitHub Pages host even though the site also runs on Vercel.
- Images are unoptimized: ~24 MB of assets. Do not add more full-size PNGs to `docs/preview/` without
  compressing — both previews there are JPEG for that reason.
- `docs/preview/hero.jpg` and `home.jpg` are embedded in `README.md`; regenerate them if the hero or
  the overall page changes materially.
- The two old `<section style="display:none">` blocks (dead menu list + products grid) were removed in
  the rebuild. They are still in git history if anyone wants them back.

## Deployment

`main` publishes to both GitHub Pages (`https://7km-69.github.io/mazaj-cafe-website/`) and Vercel
(`vercel.json`, static, `cleanUrls`). Any change must survive the subpath deploy — see the asset-path
trap above.
