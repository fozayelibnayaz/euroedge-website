import type { Page, APIRequestContext } from '@playwright/test';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'euroedge';

/** Signs in through the real UI and waits for the studio to appear. */
export const loginToAdmin = async (page: Page): Promise<void> => {
  await page.goto('/admin');
  await page.getByLabel('Username').fill(ADMIN_USERNAME);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // The studio shell (sidebar) is the reliable signal that the session is live.
  await page.locator('.ee-admin-side').waitFor({ state: 'visible', timeout: 20000 });
};

/** Selects a page inside the Pages & sections builder. */
export const selectAdminPage = async (page: Page, slug: string): Promise<void> => {
  await page.getByLabel('Page', { exact: true }).selectOption({ value: slug });
};

/** Adds a section to the page currently open in the builder. */
export const addSection = async (page: Page, type: string): Promise<void> => {
  await page.getByRole('button', { name: 'Add section' }).click();
  const block = page.locator('[data-block-id]').last();
  await block.getByRole('button', { name: 'Edit' }).click();
  await block.getByLabel('Section type').selectOption(type);
};

/** Returns an authenticated API context that bypasses the login form. */
export const apiLogin = async (request: APIRequestContext): Promise<string> => {
  const challenge = await request.get('/api/form-challenge');
  const body = (await challenge.json()) as { csrfToken: string };

  const session = await request.post('/api/session', {
    data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, _csrf: body.csrfToken },
    headers: { 'X-Requested-With': 'EuroEdgeClient', 'X-CSRF-Token': body.csrfToken },
  });

  if (!session.ok()) {
    throw new Error(`Admin login failed with status ${String(session.status())}`);
  }

  const payload = (await session.json()) as { token: string };
  return payload.token;
};

export const openAdminTab = async (page: Page, label: string): Promise<void> => {
  const side = page.locator('.ee-admin-side');
  if ((await side.getAttribute('data-open')) !== 'true') {
    await page.locator('.ee-admin-drawer-toggle').first().click().catch(() => {});
  }
  await side.getByRole('button', { name: label, exact: false }).first().click();
  await page.getByRole('heading', { name: label, level: 2 }).waitFor({ timeout: 15000 });
};

export const publish = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'Publish changes' }).click();
  await page.getByText('The live site now shows these changes.').waitFor({ timeout: 20000 });
};
