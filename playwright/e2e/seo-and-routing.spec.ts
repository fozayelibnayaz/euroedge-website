import { expect, test } from '@playwright/test';
import { gotoReady } from './helpers/app';

test.describe('SEO, redirects and crawlability', () => {
  test('sitemap.xml lists every public route and no admin routes', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('xml');

    const xml = await res.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>');
    expect(xml).not.toContain('/admin');

    const locations = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1] ?? '');
    expect(locations.length).toBeGreaterThan(8);

    const paths = new Set(
      locations.map((loc) => {
        const url = new URL(loc);
        return url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
      })
    );

    for (const path of ['/', '/study', '/courses', '/recruitment', '/about', '/blog', '/contact']) {
      expect(paths.has(path), `sitemap must list ${path}`).toBeTruthy();
    }

    const hosts = new Set(locations.map((loc) => new URL(loc).host));
    expect(hosts.size, 'every sitemap entry should use one canonical host').toBeLessThanOrEqual(1);
  });

  test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();

    const text = await res.text();
    expect(text).toMatch(/User-agent:\s*\*/i);
    expect(text).toMatch(/Allow:\s*\//i);
    expect(text).toMatch(/Disallow:\s*\/admin/i);
    expect(text).toMatch(/Sitemap:\s*http/i);
  });

  test('legacy WordPress URLs 301 to their new home', async ({ request }) => {
    const redirects: [string, string][] = [
      ['/study-in-uk', '/study/study-in-uk'],
      ['/study-in-usa/', '/study/study-in-usa'],
    ];

    for (const [from, to] of redirects) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect([301, 308], `${from} should redirect`).toContain(res.status());
      const location = res.headers().location ?? '';
      expect(location).toContain(to);
    }
  });

  test('/login is a working alias of the studio and stays out of the index', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.status() ?? 0).toBeLessThan(400);
    // The redirect lands on the studio sign-in.
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 20_000 });

    const robots = await page.request.get('/robots.txt');
    const text = await robots.text();
    expect(text).toMatch(/Disallow: \/login/);
  });

  test('an unknown page renders the 404 route with a status the browser understands', async ({
    page,
    request,
  }) => {
    const res = await request.get('/no-such-page-anywhere');
    expect(res.status()).toBe(404);

    const response = await page.goto('/no-such-page-anywhere');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/moved, or never existed/i).first()).toBeVisible();
  });

  test('every public page has a unique title and meta description', async ({ page }) => {
    const routes = [
      '/',
      '/study',
      '/courses',
      '/services',
      '/recruitment',
      '/about',
      '/blog',
      '/contact',
      '/policies',
    ];
    const titles = new Set<string>();

    for (const route of routes) {
      await gotoReady(page, route);
      const title = await page.title();
      expect(title.length, `${route} needs a title`).toBeGreaterThan(10);
      titles.add(title);

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveCount(1);
      const content = await description.getAttribute('content');
      expect((content ?? '').length, `${route} needs a meta description`).toBeGreaterThan(30);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
    }

    expect(titles.size).toBe(routes.length);
  });

  test('canonical URLs and Open Graph tags are present on an article page', async ({ page }) => {
    await gotoReady(page, '/blog');
    const firstLink = page.locator('a[href^="/blog/"]').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    await gotoReady(page, href ?? '/blog');

    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);
    const ogContent = await ogTitle.getAttribute('content');
    expect((ogContent ?? '').length).toBeGreaterThan(5);
  });

  test('images carry alt text and pages expose one h1', async ({ page }) => {
    for (const route of ['/', '/study', '/recruitment', '/about']) {
      await gotoReady(page, route);
      await expect(page.locator('h1')).toHaveCount(1);

      const missingAlt = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img')).filter((img) => {
          const alt = img.getAttribute('alt');
          // Every image must carry an alt attribute. Purely decorative ones
          // (hidden from assistive tech) are correctly marked with alt="",
          // but anything exposed to a screen reader needs real text.
          if (alt === null) {
            return true;
          }
          const decorative =
            img.closest('[aria-hidden="true"]') !== null ||
            img.getAttribute('role') === 'presentation';
          return !decorative && alt.trim().length === 0;
        }).length
      );
      expect(missingAlt, `${route} has images without alt text`).toBe(0);
    }
  });
});
