/**
 * Wasel design tokens — 8px grid, premium SaaS language.
 * Prefer these over magic numbers in StyleSheets.
 */

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  label: 10,
  caption: 11,
  body: 13,
  cardTitle: 14,
  section: 15,
  screen: 17,
  heading: 22,
} as const;

export const lineHeight = {
  label: 13,
  caption: 15,
  body: 18,
  cardTitle: 19,
  section: 20,
  screen: 22,
  heading: 28,
} as const;

export const control = {
  height: 44,
  /** Compact fields (search bars). */
  searchHeight: 40,
  chipHeight: 28,
  touchMin: 44,
  headerNav: 48,
  headerWave: 22,
  headerTotalApprox: 110,
} as const;

export const elevation = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  button: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

/** Soft chip backgrounds — light mode (clearer tint, not washed out). */
export const statusSoftLight = {
  waiting: {bg: '#FEF3C7', fg: '#92400E'},
  accepted: {bg: '#DBEAFE', fg: '#1E3A8A'},
  onTheWay: {bg: '#E0E7FF', fg: '#3730A3'},
  delivered: {bg: '#D1FAE5', fg: '#065F46'},
  cancelled: {bg: '#FEE2E2', fg: '#991B1B'},
} as const;

/** Soft chip backgrounds — dark mode. */
export const statusSoftDark = {
  waiting: {bg: 'rgba(251,191,36,0.24)', fg: '#FDE68A'},
  accepted: {bg: 'rgba(96,165,250,0.28)', fg: '#93C5FD'},
  onTheWay: {bg: 'rgba(129,140,248,0.30)', fg: '#C7D2FE'},
  delivered: {bg: 'rgba(52,211,153,0.28)', fg: '#A7F3D0'},
  cancelled: {bg: 'rgba(248,113,113,0.28)', fg: '#FECACA'},
} as const;

/** @deprecated Prefer statusSoftFor(themeType) */
export const statusSoft = statusSoftLight;

export const paymentSoftLight = {
  cod: {bg: '#A7F3D0', fg: '#065F46'},
  prepaid: {bg: '#E2E8F0', fg: '#475569'},
} as const;

export const paymentSoftDark = {
  cod: {bg: 'rgba(52,211,153,0.28)', fg: '#A7F3D0'},
  prepaid: {bg: 'rgba(148,163,184,0.24)', fg: '#CBD5E1'},
} as const;

/** @deprecated Prefer paymentSoftFor(themeType) */
export const paymentSoft = paymentSoftLight;

export type SoftTone = keyof typeof statusSoftLight;

export function statusSoftFor(themeType: 'light' | 'dark') {
  return themeType === 'dark' ? statusSoftDark : statusSoftLight;
}

export function paymentSoftFor(themeType: 'light' | 'dark') {
  return themeType === 'dark' ? paymentSoftDark : paymentSoftLight;
}

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

export const motion = {
  fast: 150,
  normal: 200,
  slow: 250,
} as const;
