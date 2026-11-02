export const tokens = {
  color: {
    primary: '#0B6E99',
    text: '#1F2933',
    textMuted: '#52606D',
    surface: '#FFFFFF',
    border: '#D9E2EC',
    success: '#1A7F4B',
    warning: '#9A6700',
    danger: '#C62828',
  },
  font: {
    family:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    size: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    lineHeight: '1.5',
  },
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    pill: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.08)',
    md: '0 4px 12px rgba(15, 23, 42, 0.12)',
    lg: '0 12px 32px rgba(15, 23, 42, 0.16)',
  },
  motion: {
    fast: '150ms',
    base: '250ms',
  },
  breakpoint: {
    xs: '360px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export const tokensCss = `:root {
  --vs-color-primary: ${tokens.color.primary};
  --vs-color-text: ${tokens.color.text};
  --vs-color-text-muted: ${tokens.color.textMuted};
  --vs-color-surface: ${tokens.color.surface};
  --vs-color-border: ${tokens.color.border};
  --vs-color-success: ${tokens.color.success};
  --vs-color-warning: ${tokens.color.warning};
  --vs-color-danger: ${tokens.color.danger};
  --vs-font-family: ${tokens.font.family};
  --vs-line-height: ${tokens.font.lineHeight};
  --vs-radius-md: ${tokens.radius.md};
  --vs-radius-lg: ${tokens.radius.lg};
  --vs-shadow-sm: ${tokens.shadow.sm};
  --vs-shadow-md: ${tokens.shadow.md};
  --vs-motion-fast: ${tokens.motion.fast};
  --vs-motion-base: ${tokens.motion.base};
}`;
