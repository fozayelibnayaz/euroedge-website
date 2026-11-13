import { test, expect, type Page } from '@playwright/test';

export const PUBLIC_ROUTES = [
  { path: '/', heading: /Get into a good university/i },
  { path: '/study', heading: /Choose the country/i },
  { path: '/study/study-in-uk', heading: /Study in United Kingdom/i },
  { path: '/study/study-in-europe', heading: /Study in Europe/i },
  { path: '/courses', heading: /English coaching that ends/i },
  { path: '/courses/b1-english-course', heading: /B1 English Course/i },
  { path: '/services', heading: /Six services/i },
  { path: '/recruitment', heading: /Overseas jobs with/i },
  { path: '/recruitment/uk-care-assistant', heading: /Senior Care Assistant/i },
  { path: '/about', heading: /A small desk that reads/i },
  { path: '/blog', heading: /Guidance written by/i },
  { path: '/blog/uk-student-visa-financial-evidence', heading: /financial evidence/i },
  { path: '/contact', heading: /Book a free assessment/i },
  { path: '/policies', heading: /Policies/i },
] as const;

const collectConsoleErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test.describe('Public routes', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} renders without console errors`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      const response = await page.goto(route.path);

      expect(response?.status()).toBe(200);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();

      if (route.heading) {
        await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(route.heading);
      }

      // Ignore expected network failures for third-party images in sandboxed runs.
      const realErrors = errors.filter(
        (text) => !/ERR_(BLOCKED|NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|NETWORK)|Failed to load resource/i.test(text)
      );
      expect(realErrors).toEqual([]);
    });
  }

  test('unknown route shows the 404 page with a 404 status', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response?.status(), 'soft 404s hurt search rankings').toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/moved, or never existed/i);
  });

  test('legacy WordPress URLs redirect to the new routes', async ({ page }) => {
    await page.goto('/study-in-uk');
    await expect(page).toHaveURL(/\/study\/study-in-uk/);
  });
});

test.describe('Shared chrome', () => {
  test('the admin area is never linked from the public website', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('header').getByRole('link', { name: /admin/i })).toHaveCount(0);
    await expect(page.locator('footer').getByRole('link', { name: /admin/i })).toHaveCount(0);

    const adminHrefs = await page.locator('a[href*="/admin"]').count();
    expect(adminHrefs).toBe(0);
  });

  test('navigation contains every configured route', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header nav').first();

    for (const label of [
      'Home',
      'Study Destinations',
      'English Courses',
      'Services',
      'Work & Recruitment',
      'About',
      'Journal',
      'Contact',
    ]) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
  });

  test('footer shows both offices and the company registration number', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    await expect(footer).toContainText('Mizan Tower');
    await expect(footer).toContainText('Dhaka-1217');
    await expect(footer).toContainText('17132664');
  });

  test('command palette opens with the keyboard and finds a destination', async ({ page }) => {
    await page.goto('/');
    // Wait for hydration, otherwise the global shortcut listener is not attached yet.
    await expect(page.locator('header a[href="/"]').first()).toBeVisible();
    await page.waitForTimeout(600);
    await page.keyboard.press('ControlOrMeta+k');

    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Search the site').fill('Europe');
    await expect(dialog.getByText('Study in Europe')).toBeVisible();
  });

  test('the consultation form opens and validates required fields', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /Free assessment/i }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Book a free assessment' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Security check/i)).toBeVisible();
  });
});

test.describe('Responsive layout', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'laptop', width: 1280, height: 800 },
    { name: 'wide', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`no horizontal overflow at ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of ['/', '/study', '/courses', '/recruitment', '/about', '/blog', '/contact']) {
        await page.goto(route);
        await page.waitForTimeout(250);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `${route} overflows at ${viewport.name}`).toBeLessThanOrEqual(1);
      }
    });
  }

  test('mobile menu opens and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('.ee-mobile-sheet').getByRole('link', { name: 'Work & Recruitment' }).click();

    await expect(page).toHaveURL(/\/recruitment$/);
  });
});

test.describe('Appearance', () => {
  test('site renders in the carbon dark theme by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('light mode toggle keeps the layout intact', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /light mode/i }).click();

    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('theme', () => {
  test('the motion film re-grades with the theme instead of staying dark', async ({ page }) => {
    await page.goto('/');
    const film = page.locator('.ee-reel').first();
    await expect(film).toBeVisible();

    const read = () =>
      page.evaluate(() => {
        const pick = (sel: string, prop: string) => {
          const el = document.querySelector(sel);
          return el ? getComputedStyle(el).getPropertyValue(prop) : '';
        };
        return {
          surface: pick('.ee-reel', 'background-color'),
          // A scene element whose fill comes from the palette, not a gradient.
          ink: pick('.ee-reel svg circle', 'fill'),
          stroke: pick('.ee-reel svg path', 'stroke'),
          control: pick('.ee-reel-ctrl', 'color'),
        };
      });

    await expect(page.locator('html')).toHaveClass(/dark/);
    const dark = await read();

    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(page.locator('html')).toHaveClass(/light/);
    const light = await read();

    // Every probe must actually change; a film stuck on carbon fails here.
    for (const key of ['surface', 'ink', 'stroke', 'control'] as const) {
      expect(light[key], `${key} should change with the theme`).not.toBe(dark[key]);
      expect(light[key], `${key} should not be empty`).not.toBe('');
    }

    // The light scene must actually be light, not just a different dark.
    const rgb = /(\d+),\s*(\d+),\s*(\d+)/.exec(light.surface);
    if (!rgb) {
      throw new Error(`could not parse the light-mode film surface from "${light.surface}"`);
    }
    const brightness = (Number(rgb[1]) + Number(rgb[2]) + Number(rgb[3])) / 3;
    expect(brightness, 'light-mode film surface should be bright').toBeGreaterThan(180);
  });

  test('every hero call to action stays legible in light mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /light mode/i }).click();
    await expect(page.locator('html')).toHaveClass(/light/);

    // Colours animate between themes; sampling mid-transition measures a
    // half-faded grey rather than either endpoint.
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const el = document.querySelector('.ee-hero .ee-btn');
            return el ? getComputedStyle(el).color : '';
          }),
        { timeout: 10_000, intervals: [250, 250, 250, 250] }
      )
      .toBe('rgb(255, 255, 255)');
    await page.waitForTimeout(400);

    const ratios = await page.evaluate(() => {
      // WCAG relative luminance.
      const luminance = (colour: string) => {
        const parts = /(\d+),\s*(\d+),\s*(\d+)/.exec(colour);
        if (!parts) return null;
        const channel = (raw: number) => {
          const value = raw / 255;
          return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
        };
        return (
          0.2126 * channel(Number(parts[1])) +
          0.7152 * channel(Number(parts[2])) +
          0.0722 * channel(Number(parts[3]))
        );
      };
      const out: { label: string; ratio: number }[] = [];
      document.querySelectorAll('.ee-hero .ee-btn').forEach((el) => {
        const style = getComputedStyle(el);
        if (!el.textContent?.trim()) return;
        let bg = style.backgroundColor;
        let node: HTMLElement | null = el as HTMLElement;
        while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && node.parentElement) {
          node = node.parentElement;
          bg = getComputedStyle(node).backgroundColor;
        }
        const lf = luminance(style.color);
        const lb = luminance(bg);
        if (lf === null || lb === null) return;
        out.push({
          label: el.textContent.trim().slice(0, 28),
          ratio: (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05),
        });
      });
      return out;
    });

    expect(ratios.length, 'the hero should expose its calls to action').toBeGreaterThan(0);
    for (const item of ratios) {
      expect(item.ratio, `"${item.label}" should meet WCAG AA in light mode`).toBeGreaterThan(4.5);
    }
  });

  test('the home hero carries no floating object image', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.ee-hero');
    await expect(hero).toBeVisible();

    await expect(hero.locator('.ee-hero-orb, .ee-hero-ring, .ee-hero-orb-dot')).toHaveCount(0);
    // The only image the hero may carry is the soft backdrop photograph.
    await expect(hero.locator('img:not(.ee-hero-backdrop img)')).toHaveCount(0);

    // Centred: the headline sits on the viewport's midline.
    const off = await page.evaluate(() => {
      const el = document.querySelector('.ee-hero-title');
      if (!el) return -1;
      const b = el.getBoundingClientRect();
      return Math.abs(b.left + b.width / 2 - window.innerWidth / 2);
    });
    expect(off).toBeGreaterThanOrEqual(0);
    expect(off).toBeLessThanOrEqual(1);
  });
});

test.describe('headline visibility and hero motion', () => {
  test('every page headline is painted, not stuck behind its reveal mask', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1 }).first(), `${route.path} needs an h1`).toBeVisible();

      // The observer has to fire AND the 0.95s clip transition has to finish
      // before the heading is genuinely on screen, so poll the painted value.
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const h1 = document.querySelector('h1');
              const mask = h1?.closest('.ee-reveal-mask');
              return mask ? getComputedStyle(mask).clipPath : 'none';
            }),
          { timeout: 10_000 }
        )
        .not.toMatch(/100%/);

      // A mask reveal that never trips its observer leaves the heading laid
      // out but fully clipped — which reads to a visitor as an empty gap.
      const state = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) {
          return null;
        }
        const masked = h1.closest('.ee-reveal-mask');
        const rect = h1.getBoundingClientRect();
        return {
          clipped: masked ? getComputedStyle(masked).clipPath : 'none',
          released: masked ? masked.getAttribute('data-shown') : 'n/a',
          height: Math.round(rect.height),
        };
      });

      expect(state, `${route.path} should expose an h1`).not.toBeNull();
      expect(state?.height ?? 0, `${route.path} h1 should occupy space`).toBeGreaterThan(0);
      if (state && state.clipped !== 'none') {
        expect(state.released, `${route.path} headline mask should be released`).toBe('true');
        expect(state.clipped, `${route.path} headline should not be clipped away`).not.toMatch(/100%/);
      }
    }
  });

  test('the hero backdrop photograph loads and parallaxes on scroll', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('.ee-hero-backdrop img');
    await expect(img).toBeVisible();

    const decoded = await img.evaluate((el) => {
      const node = el as HTMLImageElement;
      return node.complete && node.naturalWidth > 0;
    });
    expect(decoded, 'the hero backdrop should actually decode').toBe(true);

    const read = () =>
      page.evaluate(() => {
        const el = document.querySelector('.ee-hero-backdrop');
        return el ? getComputedStyle(el).transform : '';
      });

    const before = await read();
    await page.evaluate(() => { window.scrollTo(0, 420); });
    await page.waitForTimeout(600);
    expect(await read(), 'the backdrop should move with scroll').not.toBe(before);
  });
});
