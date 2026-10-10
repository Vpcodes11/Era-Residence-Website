const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const url = 'http://127.0.0.1:4187';
async function seek(page, id, progress) {
  await page.evaluate(({ id, progress }) => {
    const trigger = ScrollTrigger.getById(id);
    scrollTo(0, trigger.start + (trigger.end - trigger.start) * progress);
    ScrollTrigger.update();
  }, { id, progress });
  await page.waitForTimeout(1800);
}
(async () => {
  fs.mkdirSync('screenshots', { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.immersive === 'ready' && document.documentElement.dataset.motionReady === 'true');
  await page.locator('[data-cookie="declined"]').click();
  const initial = await page.evaluate(() => auraImmersive.getState());
  assert(initial.triangles > 10000 && initial.drawCalls >= 4, 'The scene must render actual geometry');
  await page.screenshot({ path: 'screenshots/3d-courtyard.png' });
  await page.mouse.move(1300, 250);
  await page.waitForTimeout(1200);
  const pointer = await page.evaluate(() => auraImmersive.getState());
  assert(Math.abs(pointer.camera[0] - initial.camera[0]) > .1, 'Pointer must change the real camera');
  await page.locator('[data-day="night"]').click();
  await page.waitForFunction(() => auraImmersive.getState().night > .9);
  await page.screenshot({ path: 'screenshots/3d-night.png' });
  await page.locator('[data-day="day"]').click();
  await seek(page, 'aura-hero', .92);
  const inside = await page.evaluate(() => auraImmersive.getState());
  assert(inside.camera[2] < 6, 'Camera must pass through the modeled arch');
  await page.screenshot({ path: 'screenshots/3d-through-arch.png' });
  for (const [id, scene] of [['aura-concept', 'garden'], ['aura-architecture', 'architecture']]) {
    await seek(page, id, .5);
    await page.waitForFunction(name => auraImmersive.getState().scene === name, scene);
    assert.equal(await page.locator('canvas.immersive-canvas').count(), 1, 'Scenes share one renderer');
    await page.screenshot({ path: `screenshots/3d-${scene}.png` });
  }
  await page.locator('.footer').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => auraImmersive.getState().scene === 'rooftop');
  await page.screenshot({ path: 'screenshots/3d-rooftop.png' });
  await seek(page, 'aura-hero', .1);
  await page.waitForFunction(() => auraImmersive.getState().scene === 'courtyard');
  const canRecover = await page.evaluate(() => {
    const extension = document.querySelector('canvas.immersive-canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
    if (!extension) return false;
    window.restoreQAContext = () => extension.restoreContext();
    extension.loseContext(); return true;
  });
  if (canRecover) {
    await page.waitForFunction(() => document.documentElement.dataset.immersive === 'fallback');
    assert.equal(await page.locator('.immersive-live').count(), 0, 'Images must return after context loss');
    await page.evaluate(() => window.restoreQAContext());
    await page.waitForFunction(() => document.documentElement.dataset.immersive === 'ready');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.immersive === 'ready' && document.documentElement.dataset.motionReady === 'true');
  await page.screenshot({ path: 'screenshots/3d-mobile.png' });
  const mobile = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, state: auraImmersive.getState() }));
  assert(mobile.overflow <= 1 && mobile.state.pixelRatio <= 1.25, 'Mobile must fit and cap GPU resolution');
  await page.locator('[data-menu]').click();
  assert(await page.locator('#menu-dialog').isVisible(), 'Canvas must not intercept navigation');
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.documentElement.dataset.immersive === 'reduced');
  assert.equal(await page.locator('canvas.immersive-canvas').count(), 0, 'Live reduced-motion change must release the GPU');
  await page.reload({ waitUntil: 'load' });
  assert.equal(await page.locator('canvas.immersive-canvas').count(), 0);
  assert.deepEqual(errors, [], 'Application and shader errors');
  await browser.close();
  // A separate browser without WebGL proves graceful fallback at startup.
  const fallbackBrowser = await chromium.launch({ args: ['--disable-webgl'] });
  const fallback = await fallbackBrowser.newPage();
  await fallback.goto(url, { waitUntil: 'load' });
  await fallback.waitForFunction(() => document.documentElement.dataset.immersive === 'fallback');
  assert.equal(await fallback.locator('.immersive-live').count(), 0);
  await fallback.locator('.header-nav [data-contact]').click();
  assert(await fallback.locator('#contact-dialog').isVisible(), 'Fallback remains usable');
  await fallbackBrowser.close();
  console.log(JSON.stringify({ errors, initial, inside, mobile, contextRecovery: canRecover, checks: 'Rendered geometry, pointer perspective, day/night shader, arch traversal, four scenes, shared renderer, GPU recovery, mobile, navigation, reduced motion, no-WebGL fallback' }));
})().catch(error => { console.error(error); process.exit(1); });
