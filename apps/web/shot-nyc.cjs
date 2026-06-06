const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 1600 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /local/i }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /pick board/i }).first().click();
  await page.waitForTimeout(800);
  await page.locator('select').first().selectOption('v0.4-flushing-newark-airport');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /^set/i }).first().click();
  await page.waitForTimeout(600);
  for (const pat of [/start game/i, /start/i, /play/i]) {
    const btn = page.getByRole('button', { name: pat }).first();
    if (await btn.count()) { try { await btn.click({ timeout: 2000 }); break; } catch {} }
  }
  await page.waitForTimeout(2500);
  // Multi-step dismissal: ticket plan → keep → pass-the-laptop → ready
  for (const pat of [/skip/i, /keep \d+ tickets?/i, /keep/i, /i'?m ready/i, /ready/i, /^ok$/i]) {
    const btn = page.getByRole('button', { name: pat }).first();
    if (await btn.count()) { try { await btn.click({ timeout: 1500 }); await page.waitForTimeout(500); } catch {} }
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(600);
  const el = page.locator('.board-map').first();
  if (await el.count()) {
    await el.screenshot({ path: '/tmp/hh-nyc.png' });
    console.log('Saved /tmp/hh-nyc.png');
  }
  await browser.close();
})();
