import { expect, test, type APIRequestContext } from '@playwright/test';
import { addSection, apiLogin, loginToAdmin, openAdminTab, publish, selectAdminPage } from './helpers/admin';

const PAGES_TAB = 'Pages & sections';
const HOME_SLUG = '/';
const MEDIA_TAB = 'Media library';
const INQUIRIES_TAB = 'Enquiries';
const SECURITY_TAB = 'Security';

interface CmsPayload {
  pages: {
    slug: string;
    heroTitle: string;
    blocks: { id: string; type: string; visible: boolean }[];
  }[];
}

const readCms = async (request: APIRequestContext): Promise<CmsPayload> => {
  const res = await request.get('/api/cms');
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as CmsPayload;
};

const readHomeBlocks = async (
  request: APIRequestContext
): Promise<CmsPayload['pages'][number]['blocks']> => {
  const body = await readCms(request);
  return body.pages.find((entry) => entry.slug === HOME_SLUG)?.blocks ?? [];
};

const resetContent = async (request: APIRequestContext) => {
  const token = await apiLogin(request);
  const res = await request.post('/api/admin/cms/reset', {
    headers: { authorization: `Bearer ${token}`, 'x-requested-with': 'EuroEdgeClient' },
    data: {},
  });
  expect(res.ok()).toBeTruthy();
};

test.describe('admin access', () => {
  test('login screen shows no credential hint and rejects a wrong password', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    const text = await page.locator('.ee-login-card').innerText();
    expect(text).not.toMatch(/euroedge\s*[/\-|]\s*euroedge/i);
    expect(text).not.toMatch(/admin\s*[/\-|]\s*euroedge/i);
    expect(text).not.toMatch(/default (username|password)/i);
    expect(text).not.toMatch(/hint/i);

    // A throwaway username keeps this negative case out of the real
    // account's rate-limit bucket, so the suite can run repeatedly.
    await page.getByLabel('Username').fill(`no-such-user-${Date.now()}`);
    await page.getByLabel('Password').fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toContainText(/not recognised/i);
    await expect(page.getByLabel('Username')).toBeVisible();
  });
});

test.describe('admin studio', () => {
  test.afterEach(async ({ request }) => {
    await resetContent(request);
  });

  test('edits hero copy and publishes it to the live page instantly', async ({ page, request }) => {
    await loginToAdmin(page);
    await openAdminTab(page, PAGES_TAB);
    await selectAdminPage(page, HOME_SLUG);

    const headline = `Playwright hero ${Date.now()}`;
    await page.getByLabel('Hero headline').fill(headline);
    await publish(page);

    const live = await page.context().newPage();
    await live.goto('/');
    await expect(live.getByRole('heading', { name: headline }).first()).toBeVisible({ timeout: 20_000 });
    await live.close();

    const body = await readCms(request);
    expect(body.pages.find((entry) => entry.slug === HOME_SLUG)?.heroTitle).toBe(headline);
  });

  test('adds a section, publishes it, then deletes it without breaking the page', async ({
    page,
    request,
  }) => {
    const before = (await readHomeBlocks(request)).length;

    await loginToAdmin(page);
    await openAdminTab(page, PAGES_TAB);
    await selectAdminPage(page, HOME_SLUG);

    await addSection(page, 'stats');
    const blocks = page.locator('[data-block-id]');
    await expect(blocks).toHaveCount(before + 1);

    const added = blocks.last();
    await expect(added).toHaveAttribute('data-block-type', 'stats');
    await added.getByLabel('Heading', { exact: true }).first().fill(`Placement snapshot ${Date.now()}`);

    await publish(page);

    const live = await page.context().newPage();
    await live.goto('/');
    await expect(live.locator('main .ee-section').first()).toBeVisible();
    await expect(live).toHaveURL('/');
    await live.close();

    await blocks.last().getByRole('button', { name: 'Delete' }).click();
    await expect(blocks).toHaveCount(before);
    await publish(page);

    expect((await readHomeBlocks(request)).length).toBe(before);
  });

  test('hides a section instead of deleting it', async ({ page, request }) => {
    await loginToAdmin(page);
    await openAdminTab(page, PAGES_TAB);
    await selectAdminPage(page, HOME_SLUG);

    const blocks = page.locator('[data-block-id]');
    const total = await blocks.count();
    const second = blocks.nth(1);

    await second.getByRole('button', { name: 'Hide section' }).click();
    await expect(second).toContainText(/hidden/i);
    await publish(page);

    const apiBlocks = await readHomeBlocks(request);
    expect(apiBlocks).toHaveLength(total);
    expect(apiBlocks[1]?.visible).toBe(false);
  });

  test('media library accepts an upload and lists it', async ({ page }) => {
    await loginToAdmin(page);
    await openAdminTab(page, MEDIA_TAB);

    const logo = await page.request.get('/brand/logo-mark-blue.png').then((res) => res.body());
    await page.getByLabel('Upload images').setInputFiles({
      name: `e2e-logo-${Date.now()}.png`,
      mimeType: 'image/png',
      buffer: logo,
    });

    await expect(page.getByText(/e2e-logo-\d+/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('enquiries and security panels are reachable', async ({ page }) => {
    await loginToAdmin(page);
    await openAdminTab(page, INQUIRIES_TAB);
    await expect(page.getByRole('heading', { name: INQUIRIES_TAB, level: 2 })).toBeVisible();

    await openAdminTab(page, SECURITY_TAB);
    await expect(page.getByText(/change username/i)).toBeVisible();
    await expect(page.getByText(/recent account activity/i)).toBeVisible();
  });

  test('logging out revokes the session', async ({ page }) => {
    await loginToAdmin(page);
    await openAdminTab(page, SECURITY_TAB);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 20_000 });

    const res = await page.request.get('/api/auth/me');
    expect(res.status()).toBe(401);
  });
});
