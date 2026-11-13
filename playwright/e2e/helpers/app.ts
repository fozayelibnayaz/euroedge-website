import { expect, type Page } from '@playwright/test';

/**
 * Navigates and waits until the React app has actually rendered, so assertions
 * read the client-rendered <title>, meta tags and sections rather than the
 * static shell served from index.html.
 */
export const gotoReady = async (page: Page, path: string): Promise<void> => {
  await page.goto(path);
  await page.waitForFunction(
    () => {
      const heading = document.querySelector('h1');
      return Boolean(heading?.textContent && heading.textContent.trim().length > 0);
    },
    undefined,
    { timeout: 30_000 }
  );
};

/** Asserts the page has no horizontal overflow at the current viewport. */
export const expectNoOverflow = async (page: Page): Promise<void> => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(1);
};
