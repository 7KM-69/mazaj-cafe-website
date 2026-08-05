# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The maintainer writes in Arabic — reply in Arabic. Code, comments, and this file stay in English.

## Commands

```bash
node serve.mjs                          # static dev server → http://localhost:3000
node tools/shot.mjs                     # screenshot desktop + mobile, report browser errors
node tools/shot.mjs --full              # + full-page shots
node tools/shot.mjs --at "#fan-wrap"    # + a tight shot of one element
node tools/shot.mjs --only mobile --tag hero-v2
```

There is no build, no bundler, no linter, and no test suite. `package.json` lists `puppeteer` but nothing
uses it — `tools/shot.mjs` drives Playwright instead and resolves it from any install on the machine.
Screenshots land in `.shots/` (gitignored).

## Required workflow for every change request

1. **Understand before touching.** Read the relevant section of `index.html` end to end. Sections are
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

Everything is `index.html` — markup, CSS, and JS in one ~1035-line file, served as-is. That is
deliberate; do not split it into partials, add a framework, or introduce a build step.

**Page order:** Navbar → Hero → Our Passions → MAZAJ banner → Delightful Experience (bento) →
Our Menus (GSAP fan carousel) → infinite reel strip → Our Story / footer.

### The two-layer style system — the main source of mistakes

Nearly every element is styled with a **`style=""` attribute**, not classes. The `<style>` block in
`<head>` only holds: brand tokens (`:root`), font enforcement, a handful of component classes
(`.sh`, `.cta-*`, `.slider-*`, `.logo-badge`, `.prod-card`, `.dotline`), and the responsive overrides.

Consequences:

- To restyle an element, **edit its inline `style` attribute**. A new rule in `<style>` will lose to
  the inline one.
- Everything inside a `@media` block therefore needs `!important` — that is why the file is full of it.
  Match that convention; a responsive tweak without `!important` silently does nothing.
- Classes exist mostly as *media-query hooks* (`.hero-text`, `.exp-grid`, `.story-grid`, `.prod-grid`,
  `.passions-grid`). If you add an element that must reflow on mobile, give it a class and add the
  override to the right breakpoint block.
- Breakpoints in use: `900px`, `768px` (the main one), `540px`, `480px`.
- Brand tokens live in `:root` — `--cream #FDFBF7`, `--dark #0B132B`, `--red #C8102E`,
  `--teal #00A896`, `--text #2B2523`. Use them; do not hardcode new hexes for brand colours.

**There is no Tailwind.** A Tailwind CDN tag used to sit in `<head>` with zero Tailwind classes on the
page; it was removed. Do not reintroduce it or start writing utility classes.

### Typography and bilingual rules

Arabic is **Cairo**, English is **Montserrat**, and the `<style>` block enforces that with
`!important` on `[lang="ar"]`, `.ar`, and any element whose inline style mentions `Cairo`.

- Arabic blocks carry `lang="ar"` plus `direction:rtl; text-align:right`.
- An English paragraph inside an RTL container needs `direction:ltr; text-align:left` on itself.
- Dancing Script has **no Arabic glyphs** — never apply `.signature` to Arabic text.
- The file is UTF-8. The PowerShell console mangles Arabic on output; never judge Arabic text from a
  terminal dump — verify in a screenshot.

### The menu fan carousel

The only real JS, in an IIFE after the `OUR MENUS` section. `#fan-wrap` is empty in the markup and
filled at runtime.

- `CARDS` (image, Arabic label, external pubhtml5 URL) and `FAN` (per-card rot/scale/tx/ty/z) are
  **positional parallel arrays** — adding or removing a menu means editing both, or cards land at
  `undefined` transforms.
- `render()` switches between `buildFan()` (desktop, absolute overlap + elastic entrance + hover
  spread), `buildRow()` (≤768px, scroll-snap row), and `buildStatic()` (no GSAP), rebuilding
  `#fan-wrap` on breakpoint change. All three must stay in sync when card data changes.
- The entrance is gated on `whenVisible()` (IntersectionObserver + a 6s safety net) so the fan opens
  when the user reaches it, not at page load. Screenshots must scroll the page first — `tools/shot.mjs`
  already walks the page down before capturing.
- Hover *and* focus both call `lift(i)`, so the fan behaves the same under keyboard navigation.

### The reel strip

The marquee between the menus and *Our Story*. `#reel-track` is empty in the markup; the second IIFE
in the file fills it.

- **`REELS` is the only place video links live.** Each entry is `{ src, poster, alt }`. `src` must be
  a direct `.mp4`/`.webm` — an Instagram or TikTok *page* link is an embed and cannot autoplay muted
  inside a marquee, so it will not work. The files themselves go in `videos/` (see `videos/README.md`
  for the ffmpeg recipe and why one curated clip was left out).
- **`fill()` owns the loop maths; don't hand-tune it.** Five reels do not span a desktop viewport, so
  it lays down one set, measures it, and repeats until the track covers two screens. The keyframe
  shifts by `--set-w` — *one set width plus one gap*. Leaving the gap out makes the loop jump 12px
  every pass, which is the bug this replaced.
- Duration is derived from that same measurement at a constant `PX_PER_SECOND`, so adding or removing
  reels never needs a CSS change.
- Tiles are `aspect-ratio: 9/16` off the `--reel-h` token (380px desktop, 260px mobile). Non-portrait
  source video gets cropped to fill.
- A missing or undecodable file swaps itself for its `poster` still, so the strip degrades to
  photographs instead of black rectangles.
- **Per-tile playback**: an IntersectionObserver rooted on the clipping wrapper plays only the tiles
  currently inside the strip and pauses the rest, plus everything on tab hide. The track holds two
  screens' worth; running them all would be ~15 decoding videos.
- Paused videos abort their own range requests, which surfaces as `ERR_ABORTED` on media. That is
  normal — `tools/shot.mjs` filters it out, so don't re-add it as an error.
- `prefers-reduced-motion` skips `<video>` entirely and renders the posters.
- `serve.mjs` implements HTTP Range for video types. Without a 206 response, playback stalls.

### Motion

`prefers-reduced-motion` is honoured in three places: the CSS block near `MOTION RESTRAINT`, and the
`reduced` branches inside `buildFan()` / `buildRow()`. Any new animation must add its own opt-out
there.

## Traps

- **Asset paths must stay relative** (`instagram_images/...`, `menus_badriandhania/...`). The site is
  deployed to GitHub Pages under the `/mazaj-cafe-website/` subpath *and* to Vercel at root; a leading
  `/` breaks the Pages deploy. A previous commit exists purely to fix this.
- **Never use U+2212 MINUS SIGN (`−`) in SVG path data.** It silently invalidates the whole `d`
  attribute. Both brush-edge paths shipped with it and the top edge simply did not render.
- **Two `<section style="display:none">` blocks** — the old menu list and the old products grid,
  ~190 dead lines — are still shipped. Never "repair" them; ask before deleting them.
- **Nothing inside `.slider-track` may be `loading="lazy"`.** The track is `width: max-content` inside
  an `overflow:hidden` wrapper, so lazy assets past the viewport edge never load and the strip shows
  gaps. Everything else below the fold is lazy; the marquee is deliberately not.
- The nav Google Maps pin was removed (it pointed at `href="#"`). Restore it with a real Maps URL when
  the location is known — there is a `TODO` at the spot.
- `<html lang="en">` by design: the structure and headings are English, and each Arabic block carries
  its own `lang="ar"`. Keep marking new Arabic text that way; it drives the Cairo font rule too.
- `og:image` must stay an **absolute** URL (relative ones are unreliable across crawlers), so it is
  pinned to the GitHub Pages host even though the site also runs on Vercel.
- Images are unoptimized: 24 MB of assets, `docs/preview/home.png` alone is 5.8 MB. Do not add more
  full-size PNGs to `docs/preview/` without compressing.
- **The GSAP CDN is the page's single point of failure.** `render()` falls back to `buildStatic()` (a
  plain grid of the same 7 menu cards) when `gsap` is undefined, and a `<noscript>` list covers the
  JS-off case. Keep both paths working when you change the card data.
- `docs/preview/hero.png` and `home.png` are embedded in `README.md`; regenerate them if the hero or
  overall page changes materially.

## Deployment

`main` publishes to both GitHub Pages (`https://7km-69.github.io/mazaj-cafe-website/`) and Vercel
(`vercel.json`, static, `cleanUrls`). Any change must survive the subpath deploy — see the asset-path
trap above.
