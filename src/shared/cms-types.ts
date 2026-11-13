import { z } from 'zod';

/* ------------------------------------------------------------------ *
 * Shared flexible pieces
 * ------------------------------------------------------------------ */

export const statItemSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
  sublabel: z.string().default(''),
});

export const linkItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'ghost', 'whatsapp']).default('primary'),
  external: z.boolean().default(false),
});

export const officeItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  address: z.string().min(3),
  mapUrl: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  hours: z.string().default(''),
  isPrimary: z.boolean().default(false),
});

export const navItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  path: z.string().min(1),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).max(99).default(0),
});

export const socialItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().default(''),
  icon: z.enum(['facebook', 'instagram', 'linkedin', 'youtube', 'whatsapp', 'x']).default('facebook'),
});

export const mediaItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().int().min(0).default(0),
  alt: z.string().default(''),
  createdAt: z.string().default(''),
});

export const auditLogEntrySchema = z.object({
  id: z.string().min(1),
  at: z.string().min(1),
  actor: z.string().min(1),
  action: z.string().min(1),
  detail: z.string().default(''),
});

/* ------------------------------------------------------------------ *
 * Site settings
 * ------------------------------------------------------------------ */

export const siteSettingsSchema = z.object({
  brandName: z.string().min(1),
  brandSubline: z.string().min(1),
  companyRegistrationNumber: z.string().default(''),
  logoLight: z.string().default(''),
  logoDark: z.string().default(''),
  favicon: z.string().default(''),
  announcementText: z.string().default(''),
  announcementEnabled: z.boolean().default(false),
  heroBadge: z.string().min(1),
  heroTitle: z.string().min(1),
  heroHighlight: z.string().min(1),
  heroSubtitle: z.string().min(1),
  heroObjectImage: z.string().default(''),
  heroPrimaryCta: z.string().default('Book a free assessment'),
  heroSecondaryCta: z.string().default('Explore destinations'),
  phone: z.string().min(3),
  whatsapp: z.string().min(3),
  email: z.email(),
  weekdayHours: z.string().min(2),
  saturdayHours: z.string().min(2),
  sundayHours: z.string().min(2),
  mission: z.string().min(5),
  vision: z.string().min(5),
  promise: z.string().min(5),
  footerNote: z.string().default(''),
  stats: z.array(statItemSchema),
  offices: z.array(officeItemSchema),
  socials: z.array(socialItemSchema),
});

/* ------------------------------------------------------------------ *
 * Content collections
 * ------------------------------------------------------------------ */

export const universityItemSchema = z.object({
  name: z.string().min(1),
  founded: z.string().default(''),
  rank: z.string().default(''),
});

export const studyDestinationSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  country: z.string().min(1),
  region: z.string().min(1),
  code: z.string().min(2).max(4),
  tagline: z.string().min(1),
  heroImage: z.string().default(''),
  overview: z.string().min(10),
  visaCategory: z.string().min(1),
  visaTimeline: z.string().min(1),
  visaFee: z.string().min(1),
  tuitionRange: z.string().min(1),
  intakeMonths: z.string().min(1),
  postStudyWork: z.string().default(''),
  accent: z.string().default(''),
  fields: z.array(z.string()),
  requirements: z.array(z.string()),
  universities: z.array(universityItemSchema),
  featured: z.boolean().default(true),
});

export const courseItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  level: z.string().min(1),
  classesCount: z.string().min(1),
  duration: z.string().min(1),
  format: z.string().min(1),
  badge: z.string().default(''),
  currency: z.string().min(1),
  originalPrice: z.string().default(''),
  discountedPrice: z.string().min(1),
  image: z.string().default(''),
  summary: z.string().min(5),
  highlights: z.array(z.string()),
  outcomes: z.array(z.string()),
  featured: z.boolean().default(true),
});

export const serviceItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  stepNumber: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(5),
  deliverables: z.array(z.string()),
});

export const recruitmentRoleSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  country: z.string().min(1),
  city: z.string().default(''),
  sector: z.string().min(1),
  employer: z.string().default(''),
  salary: z.string().default(''),
  currency: z.string().default(''),
  contractType: z.string().default(''),
  visaRoute: z.string().default(''),
  processingTime: z.string().default(''),
  summary: z.string().min(10),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()),
  image: z.string().default(''),
  status: z.enum(['open', 'closing_soon', 'closed']).default('open'),
  featured: z.boolean().default(true),
  postedAt: z.string().default(''),
});

export const teamMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(5),
  photo: z.string().default(''),
});

export const testimonialItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  destination: z.string().min(1),
  program: z.string().default(''),
  quote: z.string().min(10),
  avatar: z.string().default(''),
  rating: z.number().min(1).max(5).default(5),
});

export const faqItemSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  question: z.string().min(5),
  answer: z.string().min(5),
});

export const blogPostSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(3),
  category: z.string().min(1),
  readTime: z.string().min(1),
  publishedAt: z.string().min(1),
  author: z.string().min(1),
  coverImage: z.string().default(''),
  excerpt: z.string().min(5),
  content: z.array(z.string()),
});

/* ------------------------------------------------------------------ *
 * Page builder — one flexible block shape covers every section type
 * ------------------------------------------------------------------ */

export const BLOCK_TYPES = [
  'richText',
  'stats',
  'features',
  'steps',
  'showcase',
  'showreel',
  'priceGrid',
  'testimonials',
  'faq',
  'gallery',
  'logos',
  'cta',
  'contact',
  'table',
  // Raycast / Framer signature systems
  'heroStage',
  'keybed',
  'storyLine',
  'corridorLedger',
  'courseStudio',
] as const;

export const blockTypeSchema = z.enum(BLOCK_TYPES);

export const blockItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().default(''),
  subtitle: z.string().default(''),
  body: z.string().default(''),
  meta: z.string().default(''),
  tag: z.string().default(''),
  badge: z.string().default(''),
  image: z.string().default(''),
  video: z.string().default(''),
  href: z.string().default(''),
  accent: z.string().default(''),
  points: z.array(z.string()).default([]),
});

export const contentBlockSchema = z.object({
  id: z.string().min(1),
  type: blockTypeSchema,
  visible: z.boolean().default(true),
  eyebrow: z.string().default(''),
  title: z.string().default(''),
  subtitle: z.string().default(''),
  body: z.array(z.string()).default([]),
  footnote: z.string().default(''),
  image: z.string().default(''),
  video: z.string().default(''),
  /** Where the renderer pulls live records from. `manual` uses `items`. */
  source: z
    .enum(['manual', 'destinations', 'courses', 'roles', 'posts', 'testimonials', 'faqs', 'services', 'team'])
    .default('manual'),
  /** Layout variant supported by the renderer for this block type. */
  layout: z
    .enum(['default', 'split', 'center', 'grid', 'rail', 'bento', 'bento-7-5', 'bento-5-7', 'marquee'])
    .default('default'),
  background: z.enum(['surface', 'muted', 'gradient', 'ink', 'none']).default('surface'),
  columns: z.number().int().min(1).max(4).default(3),
  limit: z.number().int().min(1).max(24).default(6),
  ctaLabel: z.string().default(''),
  ctaHref: z.string().default(''),
  items: z.array(blockItemSchema).default([]),
});

export const pageDocSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  navLabel: z.string().default(''),
  inNav: z.boolean().default(true),
  navOrder: z.number().int().min(0).max(99).default(0),
  seoTitle: z.string().default(''),
  seoDescription: z.string().default(''),
  showHero: z.boolean().default(false),
  heroEyebrow: z.string().default(''),
  heroTitle: z.string().default(''),
  heroHighlight: z.string().default(''),
  heroSubtitle: z.string().default(''),
  heroImage: z.string().default(''),
  heroActions: z.array(linkItemSchema).default([]),
  blocks: z.array(contentBlockSchema).default([]),
  updatedAt: z.string().default(''),
});

export const cmsDataSchema = z.object({
  settings: siteSettingsSchema,
  nav: z.array(navItemSchema),
  pages: z.array(pageDocSchema),
  destinations: z.array(studyDestinationSchema),
  courses: z.array(courseItemSchema),
  services: z.array(serviceItemSchema),
  roles: z.array(recruitmentRoleSchema),
  team: z.array(teamMemberSchema),
  testimonials: z.array(testimonialItemSchema),
  faqs: z.array(faqItemSchema),
  posts: z.array(blogPostSchema),
  media: z.array(mediaItemSchema),
  updatedAt: z.string().default(''),
});

/* ------------------------------------------------------------------ *
 * Inquiries (CRM)
 * ------------------------------------------------------------------ */

export const inquiryStatusSchema = z.enum([
  'new',
  'in_review',
  'contacted',
  'converted',
  'archived',
]);

export const createInquirySchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.string().trim().max(120).pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().min(6, 'Enter a valid phone / WhatsApp number').max(32),
  countryOfInterest: z.string().trim().min(2, 'Select a study destination').max(60),
  programInterest: z.string().trim().max(100).default('University Admission'),
  preferredIntake: z.string().trim().max(60).default('Upcoming Intake'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(140),
  message: z.string().trim().min(10, 'Please share a few details (min 10 characters)').max(2500),
  challengeAnswer: z.string().trim().min(1, 'Security verification answer is required').max(16),
  challengeToken: z.string().min(10, 'Security verification token missing'),
  honeypot: z.string().max(200).optional().default(''),
  formStartedAt: z.number().optional(),
});

export const updateInquirySchema = z.object({
  status: inquiryStatusSchema.optional(),
  advisorNotes: z.string().max(2000).optional(),
});

export const mediaUploadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mime: z.string().trim().min(3).max(80),
  data: z.string().min(16),
  alt: z.string().trim().max(200).default(''),
});

/* ------------------------------------------------------------------ *
 * Inferred types
 * ------------------------------------------------------------------ */

export type StatItem = z.infer<typeof statItemSchema>;
export type LinkItem = z.infer<typeof linkItemSchema>;
export type OfficeItem = z.infer<typeof officeItemSchema>;
export type NavItem = z.infer<typeof navItemSchema>;
export type SocialItem = z.infer<typeof socialItemSchema>;
export type MediaItem = z.infer<typeof mediaItemSchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type UniversityItem = z.infer<typeof universityItemSchema>;
export type StudyDestination = z.infer<typeof studyDestinationSchema>;
export type CourseItem = z.infer<typeof courseItemSchema>;
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type RecruitmentRole = z.infer<typeof recruitmentRoleSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type TestimonialItem = z.infer<typeof testimonialItemSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;
export type BlogPost = z.infer<typeof blogPostSchema>;
export type BlockType = z.infer<typeof blockTypeSchema>;
export type BlockItem = z.infer<typeof blockItemSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type PageDoc = z.infer<typeof pageDocSchema>;
export type CmsData = z.infer<typeof cmsDataSchema>;
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;

export interface InquirySubmission {
  id: string;
  ticketId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryOfInterest: string;
  programInterest: string;
  preferredIntake: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  advisorNotes: string;
  ipHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormChallengePayload {
  question: string;
  challengeToken: string;
  issuedAt: number;
  csrfToken: string;
}

/* ------------------------------------------------------------------ *
 * Helpers shared by server + client
 * ------------------------------------------------------------------ */

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'item';

export const createId = (prefix: string): string => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};

export const emptyBlockItem = (): BlockItem => ({
  id: createId('item'),
  title: '',
  subtitle: '',
  body: '',
  meta: '',
  tag: '',
  badge: '',
  image: '',
  video: '',
  href: '',
  accent: '',
  points: [],
});

export const emptyBlock = (type: BlockType): ContentBlock => ({
  id: createId('block'),
  type,
  visible: true,
  eyebrow: '',
  title: '',
  subtitle: '',
  body: [],
  footnote: '',
  image: '',
  video: '',
  source: 'manual',
  layout: 'default',
  background: 'surface',
  columns: 3,
  limit: 6,
  ctaLabel: '',
  ctaHref: '',
  items: [],
});
