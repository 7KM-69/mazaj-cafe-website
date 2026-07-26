<div align="center">

# مزاج · Mazaj — Specialty Coffee & Dining

**A bilingual, image-led landing site for a specialty-coffee and dining brand.**
Single page, hand-built, GSAP scroll motion.

HTML · Tailwind CSS · GSAP

### ▶ [View the live site](https://7km-69.github.io/mazaj-cafe-website/)

![Mazaj](docs/preview/hero.png)

</div>

---

## What this is

A single-page marketing site for **Mazaj (مزاج)** — a specialty-coffee and casual-dining brand. It's an
editorial, photography-led page that carries the brand's mood: an Arabic/English hero, a passions
section, a "delightful experience" gallery, a fanned-out menu carousel, and an origin story — all on one
scroll, with GSAP-driven reveals.

It's a **front-end / brand site**: no backend, no checkout. The craft is in the layout, the type, the
image treatment, and the motion.

## The full page

![The Mazaj site — full page](docs/preview/home.png)

## Features

- **Bilingual, Arabic + English.** Arabic display type sits alongside English, with the brand's own voice
  in both.
- **GSAP scroll choreography.** Sections and images reveal on scroll; the menus fan out into a carousel.
- **Photography-led editorial layout.** A real image system (brand photography, lifestyle shots, product
  cards) rather than stock boxes — with gradient/blend treatments for depth.
- **Responsive.** Built mobile-first; the layout reflows cleanly from phone to desktop.
- **Zero build step.** One `index.html`, Tailwind via CDN, GSAP via CDN — open it and it runs.

## Tech stack

| Layer | Choice |
|---|---|
| Markup | HTML5, single `index.html` |
| Styling | Tailwind CSS (CDN) with an inline config |
| Motion | GSAP 3 (scroll reveals + the menu fan carousel) |
| Local dev | Node `serve.mjs` (static server) |
| Hosting | Vercel (static) |

## Getting started

```bash
node serve.mjs       # http://localhost:3000
```

Or open `index.html` in any static server. There are no dependencies to install for the site itself.

## Project structure

```
index.html               # the entire site (markup + Tailwind + GSAP)
brand/                   # the Mazaj logo
instagram_images/        # brand + lifestyle photography used across the page
menus_badriandhania/     # the menu images used in the fan carousel
serve.mjs                # local static dev server
vercel.json              # static deploy config
docs/preview/            # screenshots used in this README
```

## Licence

Released under the [MIT Licence](LICENSE). Brand name, photography, and copy are for demonstration.
