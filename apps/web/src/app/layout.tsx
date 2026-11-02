import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@vs/ui/tokens.css';
import '@vs/ui/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Climatização',
    template: '%s | Climatização',
  },
  description:
    'Instalação, manutenção e higienização de ar-condicionado com atendimento local.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
