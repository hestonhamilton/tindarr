// End-to-end run of Halloween movie night: three phone-sized browsers open the lobby URL the
// QR encodes, join by name, swipe the shared deck and see matches, against the built server
// and a stub Plex. Uses the system Chrome (no Playwright browser download).
//   npm run e2e --workspace=client        (E2E_OUT=dir keeps screenshots, E2E_PORT=port)
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';
import { startStubPlex, STUB_MOVIES, STUB_TOKEN } from './stub-plex.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const port = Number(process.env.E2E_PORT || 3101);
const base = `http://localhost:${port}`;
const out = process.env.E2E_OUT || mkdtempSync(path.join(process.env.TMPDIR || tmpdir(), 'tindarr-e2e-'));
mkdirSync(out, { recursive: true });

const PHONES = [
  { name: 'Ana', device: 'iPhone SE' },
  { name: 'Ben', device: 'iPhone 13' },
  { name: 'Cat', device: 'Pixel 7' },
];
const CURATED = STUB_MOVIES.filter((m) => !['Paddington 2', 'Heat'].includes(m.title));

let failures = 0;
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures++;
};
// isVisible() doesn't wait; this does
const appears = (locator, timeout = 5000) => locator.first().waitFor({ timeout }).then(() => true, () => false);
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.png`) });

const titleOf = async (page) => (await page.locator('.movieInfo h2').first().textContent())?.replace(/\s*\(\d{4}\)$/, '').trim();

// Layout checks for a phone: nothing scrolls sideways, and the given elements sit fully on screen
async function fitsScreen(page, label, selectors) {
  const { scrollWidth, clientWidth, height } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    height: window.innerHeight,
  }));
  check(scrollWidth <= clientWidth, `${label}: no horizontal scroll (${scrollWidth} <= ${clientWidth})`);
  for (const selector of selectors) {
    const box = await page.locator(selector).first().boundingBox();
    check(!!box && box.y >= 0 && box.y + box.height <= height, `${label}: ${selector} on screen`);
  }
}

async function dismissMatch(page) {
  const overlay = page.getByTestId('match-overlay');
  if (await overlay.isVisible()) await overlay.getByRole('button', { name: /keep swiping/i }).click();
}

async function main() {
  console.log(`building client for ${base}`);
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, env: { ...process.env, VITE_BACKEND_URL: base }, stdio: 'inherit' });
  if (build.status !== 0) throw new Error('build failed');

  const plex = await startStubPlex();
  const plexUrl = `http://127.0.0.1:${plex.address().port}`;
  const server = spawn('node', ['packages/server/dist/index.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), PLEX_URL: plexUrl, PLEX_TOKEN: STUB_TOKEN, FRONTEND_ORIGIN: base },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    for (let i = 0; ; i++) {
      try { if ((await fetch(`${base}/api/rooms/BOO`)).ok) break; } catch { /* not up yet */ }
      if (i > 50) throw new Error('server did not open the BOO lobby');
      await new Promise((r) => setTimeout(r, 200));
    }

    // A lobby that isn't open gets a friendly message, not an error
    {
      const context = await browser.newContext({ ...devices['iPhone SE'], defaultBrowserType: undefined });
      const page = await context.newPage();
      await page.goto(`${base}/room/ZZZZ`);
      check(await appears(page.getByText(/isn.t open yet/i)), 'unknown lobby: "isn\'t open yet" message');
      await shot(page, '00-lobby-not-open');
      await context.close();
    }

    // Scan: each phone opens the URL the QR encodes and joins by name
    const phones = [];
    for (const { name, device } of PHONES) {
      const context = await browser.newContext({ ...devices[device], defaultBrowserType: undefined });
      const page = await context.newPage();
      page.on('pageerror', (e) => check(false, `${name}: page error ${e.message}`));
      await page.goto(`${base}/room/BOO`);
      await page.getByText(/Halloween Movie Night/i).first().waitFor({ timeout: 5000 });
      await shot(page, `01-name-gate-${name}`);
      await page.getByTestId('name-input').fill(name);
      await page.getByTestId('join-button').click();
      phones.push({ name, page, context });
    }
    for (const { name, page } of phones) {
      await page.getByTestId('like-button').waitFor({ timeout: 10000 });
      const people = page.getByTestId('people');
      for (const other of PHONES) await people.getByText(other.name).waitFor({ timeout: 5000 });
      check(true, `${name}: lobby shows all three people`);
      await fitsScreen(page, `${name} lobby`, ['.movieInfo h2', '[data-testid="like-button"]', '[data-testid="nope-button"]']);
      await shot(page, `02-lobby-${name}`);
    }

    // Everyone sees the same shuffled deck
    const firstTitles = await Promise.all(phones.map(({ page }) => titleOf(page)));
    check(new Set(firstTitles).size === 1, `same first card for all (${firstTitles.join(' / ')})`);

    // Vote 1: all like -> match on every phone
    for (const { page } of phones) await page.getByTestId('like-button').click();
    for (const { name, page } of phones) {
      check(await appears(page.getByTestId('match-overlay')), `${name}: match overlay after unanimous like`);
      await page.waitForTimeout(900); // let the pop-in animation finish before the screenshot
      await fitsScreen(page, `${name} match`, ['[data-testid="match-overlay"] button:has-text("Keep swiping")']);
      await shot(page, `03-match-${name}`);
      await dismissMatch(page);
    }

    // Vote 2: one nope -> no match
    const [ana, ben, cat] = phones;
    const secondTitle = await titleOf(ana.page);
    await ana.page.getByTestId('nope-button').click();
    await ben.page.getByTestId('like-button').click();
    await cat.page.getByTestId('like-button').click();
    await ben.page.waitForTimeout(1500);
    check(!(await ben.page.getByTestId('match-overlay').isVisible()), 'no match when one person says nope');

    // A reload keeps your place in the deck
    const before = await titleOf(ben.page);
    await ben.page.reload();
    await ben.page.getByTestId('like-button').waitFor({ timeout: 10000 });
    check((await titleOf(ben.page)) === before, `reload resumes at the same card (${before})`);

    // A real drag gesture swipes the card (Ana drags right = like)
    const anaTitle = await titleOf(ana.page);
    const card = await ana.page.locator('.cardContainer .card').first().boundingBox();
    if (card) {
      const y = card.y + card.height / 2;
      await ana.page.mouse.move(card.x + card.width / 2, y);
      await ana.page.mouse.down();
      for (let dx = 0; dx <= 260; dx += 20) await ana.page.mouse.move(card.x + card.width / 2 + dx, y);
      await ana.page.mouse.up();
      await ana.page.waitForTimeout(800);
    }
    check((await titleOf(ana.page)) !== anaTitle, 'drag right swipes to the next card');
    await dismissMatch(ana.page);

    // Swipe out the rest; collect every title seen so the curated filter can be checked
    const seen = new Set([...firstTitles, secondTitle]);
    for (const { name, page } of phones) {
      for (let i = 0; i < 20; i++) {
        await dismissMatch(page);
        if (await page.getByTestId('deck-done').isVisible()) break;
        const title = await titleOf(page);
        if (title) seen.add(title);
        await page.getByTestId('like-button').click();
        await page.waitForTimeout(150);
      }
      await dismissMatch(page);
      check(await appears(page.getByTestId('deck-done')), `${name}: end-of-deck screen`);
    }
    check(seen.size === CURATED.length && [...seen].every((t) => CURATED.some((m) => m.title === t)), `deck is exactly the curated titles in the library (${[...seen].join(', ')})`);

    for (const { name, page } of phones) {
      await page.waitForTimeout(500); // the last unanimous like can pop a match after the deck ends
      await dismissMatch(page);
      const rows = page.getByTestId('tally-row');
      await rows.first().waitFor({ timeout: 5000 });
      const count = await rows.count();
      // Ana said nope to the second card and liked everything else (the drag included)
      const texts = await rows.allTextContents();
      const expected = texts.every((t) => (t.includes(secondTitle) ? /2\/3/ : /3\/3/).test(t));
      check(count === CURATED.length && expected, `${name}: tally is ${secondTitle} 2/3, everything else 3/3 (${count} rows)`);
      await fitsScreen(page, `${name} tally`, []);
      await shot(page, `04-tally-${name}`);
    }
  } finally {
    await browser.close();
    server.kill();
    plex.close();
  }
  console.log(`\nscreenshots: ${out}`);
  if (failures) {
    console.log(`${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('all checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
