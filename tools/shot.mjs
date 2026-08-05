/**
 * Screenshot helper — verifies a change in a real browser.
 *
 * Requires `node serve.mjs` to already be running on :3000.
 *
 *   node tools/shot.mjs                     desktop + mobile, above-the-fold
 *   node tools/shot.mjs --full              also capture full-page shots
 *   node tools/shot.mjs --at "#fan-wrap"    scroll to a selector and shoot it
 *   node tools/shot.mjs --only mobile       one viewport only (desktop|mobile)
 *   node tools/shot.mjs --tag menu-fix      name the files (default: "shot")
 *
 * Writes PNGs to .shots/ (gitignored) and prints any console/page errors.
 */
import { pathToFileURL } from 'url';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.shots');
const URL_ = process.env.SITE_URL || 'http://localhost:3000/';

/* Playwright is not a dependency of this repo — reuse whatever install exists. */
async function loadChromium() {
  const candidates = [
    'playwright',
    process.env.PLAYWRIGHT_PATH,
    join(ROOT, 'node_modules/playwright/index.mjs'),
    'C:/Users/ahmad/Downloads/playwright-lab/node_modules/playwright/index.mjs',
  ].filter(Boolean);

  for (const c of candidates) {
    const spec = c === 'playwright' ? c : existsSync(c) ? pathToFileURL(c).href : null;
    if (!spec) continue;
    try {
      return (await import(spec)).chromium;
    } catch { /* try next */ }
  }
  throw new Error(
    'Playwright not found. Install it here (npm i -D playwright) or set PLAYWRIGHT_PATH ' +
    'to an existing playwright/index.mjs.'
  );
}

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (argv[i + 1] ?? true);
};
const FULL = argv.includes('--full');
const AT = flag('at');
const ONLY = flag('only');
const TAG = flag('tag', 'shot');

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const chromium = await loadChromium();
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const problems = [];

for (const [name, vp] of Object.entries(VIEWPORTS)) {
  if (ONLY && ONLY !== name) continue;

  const page = await browser.newPage(vp);
  page.on('pageerror', (e) => problems.push(`[${name}] pageerror: ${e}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`[${name}] console: ${m.text()}`); });
  page.on('requestfailed', (r) => {
    /* Paused/buffered <video> elements cancel their own range requests. That is
       normal playback behaviour, not a broken asset — don't report it. */
    const aborted = (r.failure()?.errorText || '').includes('ERR_ABORTED');
    if (aborted && r.resourceType() === 'media') return;
    problems.push(`[${name}] request failed (${r.failure()?.errorText || '?'}): ${r.url()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`[${name}] HTTP ${r.status()}: ${r.url()}`);
  });

  const res = await page.goto(URL_, { waitUntil: 'networkidle', timeout: 30000 });
  if (!res || !res.ok()) throw new Error(`${URL_} returned ${res && res.status()} — is "node serve.mjs" running?`);

  /* Images are lazy and the fan carousel reveals on intersection, so a shot taken
     without scrolling captures blanks. Walk the page down, then return to the top. */
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  /* GSAP entrance tweens on the fan carousel run ~1.6s; wait them out. */
  await page.waitForTimeout(2000);

  /* Page shots first — an --at scroll would otherwise leave the viewport mid-page. */
  await page.screenshot({ path: join(OUT, `${TAG}-${name}.png`) });
  if (FULL) await page.screenshot({ path: join(OUT, `${TAG}-${name}-full.png`), fullPage: true });

  if (AT) {
    const el = page.locator(AT).first();
    /* Plain scrollIntoView, not scrollIntoViewIfNeeded: the latter waits for the
       element to stop moving, which never happens inside the infinite marquee. */
    await el.evaluate((n) => n.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(600);
    await el.screenshot({ path: join(OUT, `${TAG}-${name}-el.png`), animations: 'disabled' });
  }
  await page.close();
}

await browser.close();

console.log(`Saved to ${OUT}`);
if (problems.length) {
  console.log('\nBrowser reported:');
  for (const p of [...new Set(problems)]) console.log('  - ' + p);
} else {
  console.log('No console errors, page errors, or failed requests.');
}
