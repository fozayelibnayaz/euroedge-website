import { chromium } from '@playwright/test';
const b = await chromium.launch();

// 1. overflow sweep across ALL routes x widths
const routes = ['/', '/study', '/study/study-in-uk', '/courses', '/courses/ielts-preparation', '/services',
  '/recruitment', '/recruitment/university-partnerships', '/about', '/blog', '/blog/uk-student-visa-financial-evidence',
  '/contact', '/policies', '/login'];
const widths = [320,360,375,390,414,430,480,540,640,720,768,820,860,900,960,1024,1080,1180,1279,1280,1366,1440,1600,1920];
console.log('--- overflow sweep ---');
let bad = 0;
for (const r of routes) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const overflows = [];
  for (const w of widths) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.goto('http://127.0.0.1:3000' + r, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(250);
    const of = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (of > 0) overflows.push(`${w}px:+${of}`);
  }
  if (overflows.length) { bad++; console.log('  OVERFLOW', r, overflows.join(' ')); }
  await p.close();
}
console.log(bad === 0 ? `  clean: ${routes.length} routes x ${widths.length} widths, 0 overflow` : `  ${bad} routes overflow`);

// 2. burger opens at every width in the burger band
console.log('--- burger open test ---');
for (const w of [320, 375, 430, 768, 900, 1024, 1180, 1279]) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } });
  await p.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.click('.ee-burger');
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const sheet = document.querySelector('.ee-mobile-sheet');
    if (!sheet) return { open: false };
    const b2 = sheet.getBoundingClientRect();
    const links = sheet.querySelectorAll('a');
    return { open: b2.width > 0 && b2.height > 0, links: links.length, w: Math.round(b2.width),
             of: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  console.log(`  ${String(w).padStart(4)}px open=${r.open} links=${r.links} sheetW=${r.w} overflow=${r.of}`);
  await p.close();
}

// 3. hero centering
console.log('--- hero centering (viewport centre vs element centre) ---');
for (const w of [390, 768, 1280, 1920]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => {
    const c = (sel) => {
      const e = document.querySelector(sel); if (!e) return null;
      const b = e.getBoundingClientRect(); const cx = Math.round(b.left + b.width / 2);
      return { cx, off: Math.round(cx - window.innerWidth / 2), w: Math.round(b.width) };
    };
    return { title: c('.ee-hero-title'), lead: c('.ee-hero-lead'), orb: c('.ee-hero-orb'),
             h1align: getComputedStyle(document.querySelector('.ee-hero-title')).textAlign,
             badge: c('.ee-eyebrow') };
  });
  console.log(`  ${String(w).padStart(4)}px h1=${r.h1align} off(title)=${r.title.off} off(lead)=${r.lead.off} off(orb)=${r.orb.off} off(eyebrow)=${r.badge.off}`);
  await p.close();
}
await b.close();
