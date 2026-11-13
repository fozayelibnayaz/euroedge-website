import type { Request, Response } from 'express';
import { ROUTES } from '../config/constants';
import { getCmsData } from '../services/cms-store';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getSitemap = (req: Request, res: Response): void => {
  const { protocol } = req;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host ?? ''}`;
  const currentDate = formatDate(new Date());
  const cms = getCmsData();

  const staticEntries = [
    { loc: ROUTES.HOME, priority: '1.0', changefreq: 'weekly' },
    { loc: ROUTES.STUDY, priority: '0.9', changefreq: 'weekly' },
    { loc: ROUTES.COURSES, priority: '0.9', changefreq: 'weekly' },
    { loc: ROUTES.SERVICES, priority: '0.9', changefreq: 'monthly' },
    { loc: ROUTES.RECRUITMENT, priority: '0.9', changefreq: 'weekly' },
    { loc: ROUTES.ABOUT, priority: '0.8', changefreq: 'monthly' },
    { loc: ROUTES.BLOG, priority: '0.8', changefreq: 'weekly' },
    { loc: ROUTES.CONTACT, priority: '0.9', changefreq: 'monthly' },
    { loc: ROUTES.POLICIES, priority: '0.5', changefreq: 'yearly' },
  ];

  const destinationEntries = cms.destinations.map((dest) => ({
    loc: `/study/${dest.slug}`,
    priority: '0.85',
    changefreq: 'weekly',
  }));

  const courseEntries = cms.courses.map((course) => ({
    loc: `/courses/${course.slug}`,
    priority: '0.85',
    changefreq: 'weekly',
  }));

  const roleEntries = cms.roles.map((role) => ({
    loc: `/recruitment/${role.slug}`,
    priority: '0.85',
    changefreq: 'weekly',
  }));

  const blogEntries = cms.posts.map((post) => ({
    loc: `/blog/${post.slug}`,
    priority: '0.75',
    changefreq: 'monthly',
  }));

  const allEntries = [
    ...staticEntries,
    ...destinationEntries,
    ...courseEntries,
    ...roleEntries,
    ...blogEntries,
  ];

  const urlNodes = allEntries
    .map(
      (entry) => `  <url>
    <loc>${baseUrl}${entry.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
};
