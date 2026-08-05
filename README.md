<div align="center">

# مزاج · Mazaj — Specialty Coffee & Dining

**A bilingual, image-led landing site for a specialty-coffee and dining brand.**
Single page, hand-built, GSAP scroll motion.

HTML · CSS · GSAP

### ▶ [View the live site](https://7km-69.github.io/mazaj-cafe-website/)

![Mazaj](docs/preview/hero.jpg)

</div>

---

## What this is

A single-page marketing site for **Mazaj (مزاج)** — a specialty-coffee and casual-dining brand. It's an
editorial, photography-led page that carries the brand's mood: an Arabic/English hero, a passions
section, a "delightful experience" gallery, a fanned-out menu carousel, a strip of looping reels, and an
origin story — all on one scroll, with GSAP-driven reveals.

It's a **front-end / brand site**: no backend, no checkout. The craft is in the layout, the type, the
image treatment, and the motion.

## The full page

![The Mazaj site — full page](docs/preview/home.jpg)

## Features

- **Bilingual, Arabic + English.** Arabic display type sits alongside English, with the brand's own voice
  in both.
- **GSAP scroll choreography.** Sections and images reveal on scroll; the menus fan out into a carousel
  when you reach them.
- **A reel strip that plays.** Muted, looping 9:16 clips from the brand's own channels, scrolling as one
  continuous marquee. Only the tiles on screen decode; the rest hold their poster frame.
- **Photography-led editorial layout.** A real image system (brand photography, lifestyle shots, product
  cards) rather than stock boxes — with gradient/blend treatments for depth.
- **Responsive.** Built mobile-first; the layout reflows cleanly from phone to desktop.
- **Accessible by default.** Visible focus states, WCAG AA contrast, ~44px touch targets, per-element
  language marking, and a full `prefers-reduced-motion` path.
- **Zero build step.** One `index.html`, one CDN script for GSAP — open it and it runs.

## Tech stack

| Layer | Choice |
|---|---|
| Markup | HTML5, single `index.html` |
| Styling | Hand-written CSS, no framework |
| Motion | GSAP 3 (scroll reveals + the menu fan carousel), CSS for the reel marquee |
| Media | `<video>`, re-encoded to 540×960 loops with ffmpeg |
| Local dev | Node `serve.mjs` (static server, with Range support for video) |
| Hosting | GitHub Pages + Vercel (static) |

## Getting started

```bash
node serve.mjs       # http://localhost:3000
```

Or open `index.html` in any static server. There are no dependencies to install for the site itself.

## Project structure

```
index.html               # the entire site (markup + CSS + GSAP)
brand/                   # the Mazaj logo
instagram_images/        # brand + lifestyle photography used across the page
menus_badriandhania/     # the menu images used in the fan carousel
videos/                  # the reel clips + poster frames (see videos/README.md)
serve.mjs                # local static dev server
tools/shot.mjs           # screenshots desktop + mobile, reports browser errors
CLAUDE.md                # working notes for anyone (or anything) editing this file
vercel.json              # static deploy config
docs/preview/            # screenshots used in this README
```

## Licence

Released under the [MIT Licence](LICENSE). Brand name, photography, and copy are for demonstration.
