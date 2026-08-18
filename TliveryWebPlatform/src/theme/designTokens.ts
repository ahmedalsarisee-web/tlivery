/**
 * Wasel design tokens for web — mirrors mobile semantic system.
 */

export const space = {
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
} as const;

export const radius = {
  sm: '12px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  pill: '999px',
} as const;

export const fontSize = {
  label: '0.75rem',
  caption: '0.875rem',
  body: '1rem',
  cardTitle: '1.125rem',
  section: '1.375rem',
  screen: '1.625rem',
  heading: '2rem',
} as const;

export const control = {
  height: '56px',
  chipHeight: '30px',
  touchMin: '48px',
} as const;

export const elevation = {
  card: '0 4px 20px rgba(15, 23, 42, 0.05)',
  button: '0 2px 8px rgba(15, 23, 42, 0.08)',
} as const;

export const brand = {
  navy: '#0F172A',
  gold: '#D4AF37',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textDisabled: '#94A3B8',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const statusSoft = {
  waiting: {bg: '#F1F5F9', fg: '#64748B'},
  accepted: {bg: '#EFF6FF', fg: '#2563EB'},
  onTheWay: {bg: '#FEF9E7', fg: '#B45309'},
  delivered: {bg: '#ECFDF5', fg: '#15803D'},
  cancelled: {bg: '#FEF2F2', fg: '#DC2626'},
} as const;
