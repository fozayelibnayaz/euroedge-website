import { expect, test, type Page } from '@playwright/test';
import { loginToAdmin, openAdminTab, publish, selectAdminPage } from './helpers/admin';

/**
 * The business loop, end to end, with no shortcuts:
 *
 *   visitor fills the form  ->  admin sees the applicant
 *                           ->  adviser notes + status change stick
 *                           ->  admin edits live copy
 *                           ->  the public site shows the new copy
 *
 * Everything here runs through the real UI, so it also proves the
 * challenge/CSRF/rate-limit plumbing works for a genuine visitor.
 */

const HOME_SLUG = '/';
const PAGES_TAB = 'Pages & sections';
const INQUIRIES_TAB = 'Enquiries';

const stamp = (): string => String(Date.now());

/** Reads the maths question off the rendered form and answers it. */
const solveChallenge = async (page: Page): Promise<void> => {
  const label = await page.locator('label[for="inq-challenge"]').innerText();
  const sum = /(-?\d+)\s*\+\s*(-?\d+)/.exec(label);
  if (!sum) {
    throw new Error(`could not read the security question from "${label}"`);
  }
  await page.locator('#inq-challenge').fill(String(Number(sum[1]) + Number(sum[2])));
};

/** Fills the public enquiry form the way a visitor would. */
const submitEnquiry = async (page: Page, email: string, subject: string): Promise<void> => {
  await page.goto('/contact');
  await page.getByLabel('First name').fill('Loop');
  await page.getByLabel('Last name').fill('Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Phone / WhatsApp').fill('+44 7700 900000');
  await page.getByLabel('Destination of interest').fill('United Kingdom');
  await page.getByLabel('Preferred intake').fill('September 2027');
  await page.getByLabel('Subject').fill(subject);
  await page.getByLabel('Tell us about your profile').fill('MSc Data Science, 2:1, two years of experience.');

  // The form refuses to submit before it has been open for a human moment.
  await page.waitForTimeout(1200);
  await solveChallenge(page);

  await page.getByRole('button', { name: /send|submit|request/i }).first().click();
  await expect(page.getByText(/received|reference|thank/i).first()).toBeVisible({ timeout: 20_000 });
};

/** Reopens the enquiries desk filtered down to one address. */
const openEnquiry = async (page: Page, email: string, subject: string): Promise<void> => {
  await openAdminTab(page, INQUIRIES_TAB);
  await page.getByPlaceholder(/Search by reference/i).fill(email);
  await expect(page.getByText(subject).first()).toBeVisible({ timeout: 20_000 });
};

test.describe('the product loop', () => {
  test('a visitor enquiry reaches the desk and the adviser can act on it', async ({ page }) => {
    const id = stamp();
    const email = `loop-${id}@example.edu`;
    const subject = `Loop test ${id}`;

    // ---- 1. A real visitor fills the public enquiry form -------------------
    await submitEnquiry(page, email, subject);

    // ---- 2. The adviser finds the applicant in the studio ------------------
    await loginToAdmin(page);
    await openEnquiry(page, email, subject);

    const row = page.locator('[data-inquiry-id]').filter({ hasText: subject }).first();
    await expect(row).toBeVisible();
    // A fresh submission always starts in the "new" bucket.
    await expect(row).toHaveAttribute('data-inquiry-status', 'new');

    // ---- 3. Notes and a status change both persist -------------------------
    const note = `Called ${id} — sending the UK shortlist.`;
    await row.getByLabel('Private advisor notes').fill(note);
    await row.getByRole('button', { name: 'Save notes' }).click();
    await expect(page.getByText(/notes saved/i).first()).toBeVisible({ timeout: 20_000 });

    await row.getByRole('button', { name: 'In review', exact: true }).click();
    await expect(row).toHaveAttribute('data-inquiry-status', 'in_review', { timeout: 20_000 });

    // Reloading proves both writes reached the server, not just local state.
    await page.reload();
    await openEnquiry(page, email, subject);
    const reloaded = page.locator('[data-inquiry-id]').filter({ hasText: subject }).first();
    await expect(reloaded).toHaveAttribute('data-inquiry-status', 'in_review', { timeout: 20_000 });
    await expect(reloaded.getByLabel('Private advisor notes')).toHaveValue(note, { timeout: 20_000 });

    // ---- 4. The filter buckets agree with the status we just set -----------
    await page.getByPlaceholder(/Search by reference/i).fill('');
    await page.getByRole('button', { name: /^In review/i }).first().click();
    await expect(page.getByText(subject).first()).toBeVisible({ timeout: 20_000 });

    // ---- 5. CSV export produces a real file --------------------------------
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 20_000 }),
      page.getByRole('button', { name: 'Export CSV' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test('an admin copy edit is live on the public site immediately', async ({ page }) => {
    const headline = `Loop headline ${stamp()}`;

    // Read the existing headline so the test can put it back afterwards.
    await page.goto('/');
    const original = (await page.locator('.ee-hero-title').first().innerText()).trim();

    await loginToAdmin(page);
    await openAdminTab(page, PAGES_TAB);
    await selectAdminPage(page, HOME_SLUG);

    await page.getByLabel('Hero headline').fill(headline);
    await publish(page);

    // ---- the public site reflects the edit ---------------------------------
    const live = await page.context().newPage();
    await live.goto('/', { waitUntil: 'networkidle' });
    await expect(live.locator('.ee-hero-title').first()).toContainText(headline, { timeout: 20_000 });
    await live.close();

    // A brand-new visitor context (no admin cookie) must see it too.
    const browser = page.context().browser();
    if (!browser) {
      throw new Error('no browser attached to this context');
    }
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto('/', { waitUntil: 'networkidle' });
    await expect(anonPage.locator('.ee-hero-title').first()).toContainText(headline, { timeout: 20_000 });
    await anon.close();

    // ---- restore -----------------------------------------------------------
    await page.getByLabel('Hero headline').fill(original);
    await publish(page);
  });

  test('the hero stays centred on every viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ee-hero-title')).toBeVisible();

    for (const width of [320, 390, 768, 1024, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      const off = await page.evaluate(() => {
        const el = document.querySelector('.ee-hero-title');
        if (!el) {
          return -1;
        }
        const b = el.getBoundingClientRect();
        return Math.abs(b.left + b.width / 2 - window.innerWidth / 2);
      });
      expect(off, `hero missing at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(off, `hero drifted ${String(off)}px off centre at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
});
