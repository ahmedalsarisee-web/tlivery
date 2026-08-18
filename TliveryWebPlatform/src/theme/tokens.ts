export type ThemeMode = 'light' | 'dark';

export const lightTheme = {
  primary: '#0F172A',
  secondary: '#D4AF37',
  brandNavy: '#0F172A',
  brandGold: '#D4AF37',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textCaption: '#94A3B8',
  textInverse: '#FFFFFF',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  backdrop: 'rgba(15, 23, 42, 0.45)',
  sidebar: '#0F172A',
  sidebarText: '#F8FAFC',
  sidebarMuted: '#94A3B8',
  headerFrom: '#0F172A',
  headerTo: '#0F172A',
  buttonPrimaryBg: '#0F172A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#FFFFFF',
  buttonSecondaryText: '#0F172A',
  disabledBg: '#EEEEEE',
  disabledText: '#94A3B8',
  elevationCard: '0 4px 20px rgba(15, 23, 42, 0.05)',
  radiusCard: '20px',
  radiusControl: '16px',
  radiusButton: '18px',
} as const;

export const darkTheme = {
  primary: '#D4AF37',
  secondary: '#F8FAFC',
  brandNavy: '#122033',
  brandGold: '#D4AF37',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textCaption: '#64748B',
  textInverse: '#0F172A',
  error: '#FF6369',
  success: '#3DD68C',
  warning: '#FFC453',
  info: '#70B8FF',
  bg: '#081020',
  surface: '#122033',
  border: '#243447',
  borderLight: '#122033',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  sidebar: '#081020',
  sidebarText: '#F8FAFC',
  sidebarMuted: '#64748B',
  headerFrom: '#081020',
  headerTo: '#122033',
  buttonPrimaryBg: '#D4AF37',
  buttonPrimaryText: '#0F172A',
  buttonSecondaryBg: '#122033',
  buttonSecondaryText: '#F8FAFC',
  disabledBg: '#1A2A3D',
  disabledText: '#7A7A7A',
  elevationCard: '0 4px 20px rgba(0, 0, 0, 0.25)',
  radiusCard: '20px',
  radiusControl: '16px',
  radiusButton: '18px',
} as const;

export type ThemeTokens = typeof lightTheme;

export function applyThemeVars(mode: ThemeMode) {
  const t = mode === 'dark' ? darkTheme : lightTheme;
  const root = document.documentElement;
  root.dataset.theme = mode;
  Object.entries(t).forEach(([key, value]) => {
    root.style.setProperty(`--${camelToKebab(key)}`, value);
  });
}

function camelToKebab(value: string) {
  return value.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}
