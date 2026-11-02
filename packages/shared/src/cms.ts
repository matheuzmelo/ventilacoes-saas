import { z } from 'zod';

const shortText = z.string().trim().min(1).max(240);
const longText = z.string().trim().min(1).max(8_000);
const optionalText = z.string().trim().max(8_000).optional();
const optionalShortText = z.string().trim().max(240).optional();

export const CMS_BLOCK_TYPES = [
  'hero',
  'text',
  'image',
  'cta',
  'services',
  'testimonials',
  'faq',
  'contact',
] as const;

export type CmsBlockType = (typeof CMS_BLOCK_TYPES)[number];

const serviceItemSchema = z.object({
  title: shortText,
  description: z.string().trim().min(1).max(600),
});

const testimonialItemSchema = z.object({
  name: shortText,
  text: z.string().trim().min(1).max(1_200),
});

export const cmsBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hero'),
    title: shortText,
    subtitle: optionalText,
    ctaLabel: optionalShortText,
    ctaHref: optionalShortText,
    imageUrl: optionalShortText,
  }),
  z.object({
    type: z.literal('text'),
    title: optionalShortText,
    body: longText,
  }),
  z.object({
    type: z.literal('image'),
    url: z.string().trim().url().max(2_000),
    alt: shortText,
    caption: optionalShortText,
  }),
  z.object({
    type: z.literal('cta'),
    title: shortText,
    text: optionalText,
    label: shortText,
    href: shortText,
  }),
  z.object({
    type: z.literal('services'),
    title: optionalShortText,
    items: z.array(serviceItemSchema).min(1).max(24),
  }),
  z.object({
    type: z.literal('testimonials'),
    title: optionalShortText,
    items: z.array(testimonialItemSchema).min(1).max(12),
  }),
  z.object({
    type: z.literal('faq'),
    title: optionalShortText,
    text: optionalText,
  }),
  z.object({
    type: z.literal('contact'),
    title: optionalShortText,
    text: optionalText,
  }),
]);

export const cmsBlocksSchema = z.array(cmsBlockSchema).max(60);

export type CmsBlock = z.infer<typeof cmsBlockSchema>;

export interface CmsVersionView {
  id: string;
  version: number;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: CmsBlock[];
  createdAt: string;
}

export interface CmsPageAdmin {
  id: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  draftBlocks: CmsBlock[];
  draftUpdatedAt: string;
  publishedVersionId: string | null;
  publishedAt: string | null;
  sortOrder: number;
  showInNav: boolean;
  isSystem: boolean;
  versions: CmsVersionView[];
}

export interface SitePageView {
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: CmsBlock[];
}

export interface SiteFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SiteLegalVersion {
  slug: string;
  title: string;
  version: number;
  effectiveAt: string;
}

export interface SiteIdentity {
  title: string;
  description: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  phone: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  address: string | null;
  serviceAreas: string[];
  whatsappMessage: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  googleBusinessUrl: string | null;
}

export interface SitePayload {
  tenant: {
    id: string;
    slug: string;
    name: string;
    timezone: string;
    locale: string;
    currency: string;
    estimateMode: 'RANGE' | 'COLLECT_ONLY';
  };
  identity: SiteIdentity;
  navigation: Array<{ slug: string; title: string }>;
  home: SitePageView | null;
  faq: SiteFaqItem[];
  legal: {
    privacy: SiteLegalVersion | null;
    terms: SiteLegalVersion | null;
  };
}

export interface SitePagePayload {
  tenant: SitePayload['tenant'];
  page: SitePageView;
  faq: SiteFaqItem[];
}

export interface LegalDocumentView {
  slug: string;
  title: string;
  version: number;
  body: string;
  effectiveAt: string;
}
