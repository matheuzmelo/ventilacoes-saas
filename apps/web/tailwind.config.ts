import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: 'var(--vs-color-primary)',
        ink: 'var(--vs-color-text)',
        muted: 'var(--vs-color-text-muted)',
        surface: 'var(--vs-color-surface)',
        line: 'var(--vs-color-border)',
      },
    },
  },
  plugins: [],
};

export default config;
