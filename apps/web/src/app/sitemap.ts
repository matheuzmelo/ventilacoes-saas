import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getSite } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const base = await baseUrl();
  const now = new Date();

  const urls = new Set(['', '/privacidade', '/termos']);
  for (const item of site?.navigation ?? []) {
    urls.add(`/${item.slug}`);
  }

  return [...urls].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}

async function baseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host') ??
    requestHeaders.get('host') ??
    'localhost:3000';
  const proto =
    requestHeaders.get('x-forwarded-proto') ??
    (host.includes('localhost') || host.endsWith('.lvh.me') ? 'http' : 'https');
  return `${proto}://${host}`;
}
