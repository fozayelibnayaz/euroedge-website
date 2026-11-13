import { expect, test } from '@playwright/test';
import { apiLogin } from './helpers/admin';
import { gotoReady } from './helpers/app';

/**
 * The Raycast / Framer signature systems:
 * hero split-pane window, mechanical keybed, scroll-drawn admission line,
 * corridor ledger and the course studio bento.
 */

test.beforeAll(async ({ request }) => {
  // Guarantee the signature blocks exist regardless of run order.
  const token = await apiLogin(request);
  const res = await request.post('/api/admin/cms/reset', {
    headers: { authorization: `Bearer ${token}`, 'x-requested-with': 'EuroEdgeClient' },
    data: {},
  });
  expect(res.ok()).toBeTruthy();
});

test.describe('Raycast hero window', () => {
  test('renders a split-pane window with every corridor and course', async ({ page }) => {
    await gotoReady(page, '/');

    const window = page.locator('.ee-stage-window');
    await expect(window).toBeVisible();

    // 6 corridors + 4 programmes
    await expect(page.locator('.ee-stage-item')).toHaveCount(10);
    await expect(page.locator('.ee-stage-detail')).toBeVisible();
    await expect(page.locator('.ee-stage-readout')).toHaveCount(2);
  });

  test('searching filters the index and updates the live readouts', async ({ page }) => {
    await gotoReady(page, '/');
    const search = page.locator('.ee-stage-search input');

    await search.fill('Canada');
    await expect(page.locator('.ee-stage-item')).toHaveCount(1);
    await expect(page.locator('.ee-stage-item-name')).toHaveText('Canada');
    await expect(page.locator('.ee-stage-readout-value').first()).toContainText(/week/i);

    await search.fill('IELTS');
    await expect(page.locator('.ee-stage-item')).toHaveCount(1);
    await expect(page.locator('.ee-stage-item-name')).toHaveText('IELTS Preparation');
  });

  test('shows a helpful empty state for a nonsense query', async ({ page }) => {
    await gotoReady(page, '/');
    await page.locator('.ee-stage-search input').fill('zzzzqqq');
    await expect(page.locator('.ee-stage-item')).toHaveCount(0);
    await expect(page.getByText(/Nothing matches/i)).toBeVisible();
  });

  test('arrow keys move the cursor and Enter opens the route', async ({ page }) => {
    await gotoReady(page, '/');
    const search = page.locator('.ee-stage-search input');

    // Wait for the index to be fully populated before using the keyboard,
    // otherwise the keystroke can land before the handler is attached.
    await expect(page.locator('.ee-stage-item')).toHaveCount(10);
    await search.click();

    const activeName = page.locator('.ee-stage-item[data-active="true"] .ee-stage-item-name');
    await expect(activeName).toHaveCount(1);
    const before = await activeName.textContent();

    await search.press('ArrowDown');
    await expect(activeName).not.toHaveText(before ?? '');

    const target = await activeName.textContent();
    await search.press('Enter');
    await page.waitForURL(/\/study\/|\/courses\//, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText(new RegExp(target ?? '', 'i'));
  });
});

test.describe('Mechanical keybed', () => {
  test('renders eleven keycaps across three groups', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.locator('.ee-keycap')).toHaveCount(11);
    await expect(page.locator('.ee-keybed-group')).toHaveCount(3);
  });

  test('pressing a physical key selects that pathway', async ({ page }) => {
    await gotoReady(page, '/');
    await page.locator('body').click({ position: { x: 4, y: 260 } });

    await page.keyboard.press('f');
    await expect(page.locator('.ee-keybed-dossier h3')).toHaveText(/28-day bank audit rule/i);

    await page.keyboard.press('u');
    await expect(page.locator('.ee-keybed-dossier h3')).toHaveText(/United Kingdom/i);

    await page.keyboard.press('1');
    await expect(page.locator('.ee-keybed-dossier h3')).toHaveText(/B1 English Course/i);

    await page.keyboard.press('v');
    await expect(page.locator('.ee-keybed-dossier h3')).toHaveText(/Visa turnaround windows/i);
  });

  test('clicking a keycap selects the same pathway', async ({ page }) => {
    await gotoReady(page, '/');
    await page.locator('.ee-keycap', { hasText: 'Canada' }).click();
    await expect(page.locator('.ee-keybed-dossier h3')).toHaveText(/Canada/i);
    await expect(page.locator('.ee-keycap[data-active="true"]')).toHaveCount(1);
  });

  test('typing in the hero search never triggers a keycap', async ({ page }) => {
    await gotoReady(page, '/');
    await page.locator('.ee-keybed-dossier h3').scrollIntoViewIfNeeded();
    const before = await page.locator('.ee-keybed-dossier h3').textContent();

    const search = page.locator('.ee-stage-search input');
    await search.click();
    await search.pressSequentially('usa');

    expect(await page.locator('.ee-keybed-dossier h3').textContent()).toBe(before);
  });
});

test.describe('Scroll-drawn admission line', () => {
  test('traces the filament as the reader scrolls', async ({ page }) => {
    await gotoReady(page, '/');
    const step = page.locator('.ee-storyline-step').first();
    await step.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const early = await page.evaluate(() => {
      const filament = document.querySelector('.ee-storyline-filament');
      return filament ? new DOMMatrix(getComputedStyle(filament).transform).d : null;
    });

    await page.evaluate(() => {
      const node = document.querySelector('.ee-storyline');
      node?.scrollIntoView({ block: 'center' });
      window.scrollBy(0, 700);
    });
    await page.waitForTimeout(700);

    const later = await page.evaluate(() => {
      const filament = document.querySelector('.ee-storyline-filament');
      return filament ? new DOMMatrix(getComputedStyle(filament).transform).d : null;
    });

    expect(early).not.toBeNull();
    expect(later).not.toBeNull();
    expect(later ?? 0).toBeGreaterThan(early ?? 0);
  });

  test('renders the four admission stages', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.locator('.ee-storyline-step')).toHaveCount(4);
    await expect(page.locator('.ee-storyline-card').first()).toBeVisible();
  });
});

test.describe('Corridor ledger', () => {
  test('lists every corridor as a hairline index row', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.locator('.ee-ledger-index .ee-rail-row')).toHaveCount(6);
    await expect(page.locator('.ee-ledger-dossier-inner')).toBeVisible();
  });

  test('selecting a row swaps the sticky dossier', async ({ page }) => {
    await gotoReady(page, '/');
    const rows = page.locator('.ee-ledger-index .ee-rail-row');

    await rows.nth(2).click();
    await expect(rows.nth(2)).toHaveAttribute('data-active', 'true');
    await expect(page.locator('.ee-ledger-dossier h3')).toHaveText(/Canada/i);

    await rows.nth(0).click();
    await expect(page.locator('.ee-ledger-dossier h3')).toHaveText(/United Kingdom/i);
  });

  test('index rows are keyboard operable', async ({ page }) => {
    await gotoReady(page, '/');
    const row = page.locator('.ee-ledger-index .ee-rail-row').nth(1);
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(row).toHaveAttribute('data-active', 'true');
    await expect(page.locator('.ee-ledger-dossier h3')).toHaveText(/United States/i);
  });
});

test.describe('Course studio bento', () => {
  test('renders the 7 + 5 bento with module breakdowns', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.locator('.ee-bento-tile')).toHaveCount(4);
    await expect(page.locator('.ee-bento').first()).toHaveAttribute('data-reverse', 'false');
    await expect(page.locator('.ee-bento-modules').first()).toBeVisible();
  });

  test('the courses page uses the reversed 5 + 7 bento', async ({ page }) => {
    await gotoReady(page, '/courses');
    const bento = page.locator('.ee-bento').first();
    await expect(bento).toHaveAttribute('data-reverse', 'true');
    await expect(page.locator('.ee-bento-tile').first()).toBeVisible();
  });

  test('a bento tile links to its course', async ({ page }) => {
    await gotoReady(page, '/');
    await page.locator('.ee-bento-tile').first().click();
    await page.waitForURL(/\/courses\//, { timeout: 10_000 });
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Responsive behaviour', () => {
  const viewports = [
    { name: 'xs', width: 320, height: 700 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`every system renders at ${String(viewport.width)}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoReady(page, '/');

      await expect(page.locator('.ee-stage-window')).toBeVisible();
      await expect(page.locator('.ee-keycap')).toHaveCount(11);
      await expect(page.locator('.ee-ledger-index .ee-rail-row')).toHaveCount(6);
      await expect(page.locator('.ee-storyline-step')).toHaveCount(4);
      await expect(page.locator('.ee-bento-tile')).toHaveCount(4);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, 'no horizontal scrolling').toBeLessThanOrEqual(1);
    });
  }

});

test.describe('Touch devices', () => {
  test.use({ hasTouch: true });

  test('keycaps stay tappable on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, '/');

    const box = await page.locator('.ee-keycap').first().boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

    await page.locator('.ee-keycap', { hasText: 'Malaysia' }).tap();
    await expect(page.locator('.ee-keybed-dossier h3')).toHaveText(/Malaysia/i);
  });

  test('ledger rows are tappable on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, '/');

    const row = page.locator('.ee-ledger-index .ee-rail-row').nth(3);
    await row.scrollIntoViewIfNeeded();
    await row.tap();
    await expect(row).toHaveAttribute('data-active', 'true');
    await expect(page.locator('.ee-ledger-dossier h3')).toBeVisible();
  });

  test('the burger menu opens and navigates by touch', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, '/');

    await page.locator('.ee-burger').tap();
    await expect(page.locator('.ee-mobile-sheet')).toHaveAttribute('data-open', 'true');

    await page.locator('.ee-mobile-link', { hasText: 'Recruitment' }).tap();
    await page.waitForURL(/\/recruitment/, { timeout: 10_000 });
    await expect(page.locator('.ee-mobile-sheet')).toHaveAttribute('data-open', 'false');
  });
});
