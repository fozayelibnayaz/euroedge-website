import { expect, request as apiRequest, test } from '@playwright/test';
import { ADMIN_PASSWORD, ADMIN_USERNAME, apiLogin } from './helpers/admin';

const BASE = 'http://127.0.0.1:3000';

/** A clean API context that never holds a session. */
const guest = async () => {
  const context = await apiRequest.newContext({ baseURL: BASE });
  return context;
};

test.describe('API security', () => {
  test('admin content is unreadable and unwritable without a session', async () => {
    const context = await guest();
    const authed = await guest();
    const token = await apiLogin(authed);
    const draft = { pages: [] };

    for (const path of ['/api/admin/inquiries', '/api/admin/media', '/api/admin/audit']) {
      const get = await context.get(path);
      expect([401, 403], `${path} must refuse anonymous callers`).toContain(get.status());
    }

    // Anonymous writes are refused either by the auth guard (401) or by the
    // CSRF guard that runs ahead of it (403). Both are correct refusals.
    const refused = [401, 403];
    const writes: [string, string, unknown][] = [
      ['PUT', '/api/admin/cms', draft],
      ['POST', '/api/admin/cms/reset', {}],
      ['PUT', '/api/admin/credentials', { username: 'attacker', password: 'pwned-12345678' }],
      [
        'POST',
        '/api/admin/media',
        { mime: 'image/png', data: 'data:image/png;base64,AAAA', name: 'evil.png' },
      ],
    ];

    for (const [method, path, payload] of writes) {
      const res = await context.fetch(`${BASE}${path}`, {
        method,
        data: payload,
        headers: { 'content-type': 'application/json', 'x-requested-with': 'EuroEdgeClient' },
      });
      expect(refused, `${method} ${path} must refuse anonymous callers`).toContain(res.status());
    }

    // Even with a valid token, a write without the CSRF header must fail.
    const forged = await context.put('/api/admin/cms', {
      data: draft,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(forged.status(), 'a write without the CSRF header must be rejected').toBeGreaterThanOrEqual(400);

    await context.dispose();
    await authed.dispose();
  });

  test('the legacy starter credentials are rejected', async () => {
    const context = await guest();
    const res = await context.post('/api/session', {
      data: { username: 'test', password: 'test' },
      headers: { 'x-requested-with': 'EuroEdgeClient' },
    });
    expect([401, 403, 429]).toContain(res.status());
    await context.dispose();
  });

  test('an obviously wrong password never yields a token', async () => {
    const context = await guest();
    const challenge = await context.get('/api/form-challenge');
    const { csrfToken } = (await challenge.json()) as { csrfToken: string };

    // A throwaway username keeps this negative case out of the real account's
    // rate-limit bucket so the suite stays repeatable.
    const res = await context.post('/api/session', {
      data: { username: `no-such-user-${Date.now()}`, password: `${ADMIN_PASSWORD}-wrong`, _csrf: csrfToken },
      headers: { 'x-requested-with': 'EuroEdgeClient', 'x-csrf-token': csrfToken },
    });
    expect(res.status()).toBe(401);

    const body = (await res.json()) as { code?: string };
    expect(body.code).not.toBeUndefined();
    await context.dispose();
  });

  test('security headers are present on every HTML response', async () => {
    const context = await guest();
    const res = await context.get('/');
    const headers = res.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['x-powered-by']).toBeUndefined();

    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toContain('object-src \'none\'');
    expect(csp).toContain('base-uri \'self\'');
    // Clickjacking: neither the modern directive nor the legacy header may be absent.
    expect(csp).toContain('frame-ancestors');
    expect(headers['x-frame-options']).toBe('DENY');
    await context.dispose();
  });

  test('the session cookie is httpOnly and scoped', async () => {
    const context = await guest();
    const challenge = await context.get('/api/form-challenge');
    const { csrfToken } = (await challenge.json()) as { csrfToken: string };

    const res = await context.post('/api/session', {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, _csrf: csrfToken },
      headers: { 'x-requested-with': 'EuroEdgeClient', 'x-csrf-token': csrfToken },
    });
    expect(res.ok()).toBeTruthy();

    const setCookie = res
      .headersArray()
      .filter((entry) => entry.name.toLowerCase() === 'set-cookie')
      .map((entry) => entry.value)
      .join('; ');

    expect(setCookie.toLowerCase()).toContain('token=');
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('samesite=');
    expect(setCookie.toLowerCase()).not.toContain('samesite=none');
    await context.dispose();
  });

  test('admin pages are hidden from crawlers', async ({ page }) => {
    await page.goto('/admin');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/i);
  });

  test('malicious script payloads are stripped from stored content', async ({ request }) => {
    const token = await apiLogin(request);
    const challenge = await request.get('/api/form-challenge');
    const body = (await challenge.json()) as {
      csrfToken: string;
      question: string;
      challengeToken: string;
    };

    const [left, right] = body.question.split('+').map((part) => Number.parseInt(part.trim(), 10));
    const marker = `January intake ${Date.now()}`;

    const res = await request.post('/api/inquiries', {
      data: {
        firstName: '<img src=x onerror=alert(1)>Ayesha',
        lastName: 'Rahman',
        email: 'ayesha.rahman@example.com',
        phone: '+8801700000000',
        countryOfInterest: 'United Kingdom',
        subject: 'Script injection probe',
        message: `I want to apply for ${marker}. <script>alert(1)</script>`,
        challengeAnswer: String(left + right),
        challengeToken: body.challengeToken,
        _csrf: body.csrfToken,
        formStartedAt: Date.now() - 30_000,
      },
      headers: {
        'x-requested-with': 'EuroEdgeClient',
        'x-csrf-token': body.csrfToken,
      },
    });

    if (res.status() === 429) {
      test.skip(true, 'inquiry rate limit reached for this network');
      return;
    }
    expect(res.ok()).toBeTruthy();

    const list = await request.get('/api/admin/inquiries', {
      headers: { authorization: `Bearer ${token}` },
    });
    const payload = (await list.json()) as { inquiries: { firstName: string; message: string }[] };
    const stored = payload.inquiries.find((item) => item.message.includes(marker));
    expect(stored).toBeDefined();
    expect(stored?.firstName).not.toMatch(/</);
    expect(stored?.message).not.toMatch(/<script/i);
  });

  test('unknown API paths answer with JSON, not the SPA shell', async () => {
    const context = await guest();
    const res = await context.get('/api/definitely-not-a-route');
    expect(res.status()).toBe(404);
    expect(res.headers()['content-type']).toContain('json');
    await context.dispose();
  });

  test('a tampered JWT is rejected', async () => {
    const context = await guest();
    const authed = await guest();
    const token = await apiLogin(authed);

    const [header, payload] = token.split('.');
    const tampered = `${header}.${payload}.c2lnbmF0dXJl`;

    const res = await context.get('/api/admin/audit', {
      headers: { authorization: `Bearer ${tampered}` },
    });
    expect(res.status()).toBe(401);
    await context.dispose();
    await authed.dispose();
  });

  test('the public CMS payload carries no admin internals', async ({ page }) => {
    const res = await page.request.get('/api/cms');
    const raw = await res.text();
    expect(raw).not.toMatch(/admin-auth/i);
    expect(raw).not.toMatch(/pbkdf2/i);
    expect(raw).not.toMatch(/mustRotate/i);
  });
});
