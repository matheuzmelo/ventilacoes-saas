import type { CSSProperties, ReactNode } from 'react';
import { getSite } from '@/lib/api';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const site = await getSite();
  const style = {
    '--vs-color-primary': site?.identity.primaryColor ?? '#0b6e99',
    '--vs-color-secondary': site?.identity.secondaryColor ?? '#f59e0b',
  } as CSSProperties;

  return (
    <div style={style} className="flex min-h-screen flex-col">
      <SiteHeader site={site} />
      <div className="flex-1">{children}</div>
      <SiteFooter site={site} />
    </div>
  );
}
