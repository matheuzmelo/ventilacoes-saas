import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host') ??
    requestHeaders.get('host') ??
    'localhost:3000';
  const proto =
    requestHeaders.get('x-forwarded-proto') ??
    (host.includes('localhost') || host.endsWith('.lvh.me') ? 'http' : 'https');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/installer', '/login', '/api'],
    },
    sitemap: `${proto}://${host}/sitemap.xml`,
  };
}
