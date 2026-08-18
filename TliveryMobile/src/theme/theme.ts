import type {ThemeColors} from '@app/theme/themeColors';

export const lightTheme: ThemeColors = {
  primary: '#0F172A',
  secondary: '#D4AF37',

  brand: {
    navy: '#0F172A',
    gold: '#D4AF37',
  },

  base: {
    black: '#000000',
    white: '#FFFFFF',
  },

  typography: {
    primary: '#0F172A',
    secondary: '#64748B',
    caption: '#94A3B8',
    error: '#EF4444',
    inverse: '#FFFFFF',
  },

  button: {
    primaryBackground: '#0F172A',
    primaryText: '#FFFFFF',
    secondaryBackground: '#FFFFFF',
    secondaryText: '#0F172A',
    disabledBackground: '#F1F5F9',
    disabledText: '#94A3B8',
  },

  backgrounds: {
    background: '#F8FAFC',
    onBackground: '#0F172A',
    surface: '#FFFFFF',
    doodle: 'rgba(15, 23, 42, 0.07)',
    doodleOnDark: 'rgba(255, 255, 255, 0.12)',
  },

  ui: {
    border: '#E5E7EB',
    borderLight: '#F1F5F9',
    shadow: '#0F172A',
    card: '#FFFFFF',
    backdrop: 'rgba(15, 23, 42, 0.45)',
  },

  status: {
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#2563EB',
  },

  navigation: {
    activeTint: '#D4AF37',
    inactiveTint: '#94A3B8',
    background: '#FFFFFF',
  },

  gradient: {
    header: ['#0B1220', '#1A2B4A'],
    profile: ['#0F172A', '#1E293B'],
    skeleton: ['#F1F5F9', '#E5E7EB'],
  },
};

export const darkTheme: ThemeColors = {
  primary: '#D4AF37',
  secondary: '#F8FAFC',

  brand: {
    navy: '#122033',
    gold: '#D4AF37',
  },

  base: {
    black: '#000000',
    white: '#FFFFFF',
  },

  typography: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    caption: '#64748B',
    error: '#FF6369',
    inverse: '#0F172A',
  },

  button: {
    primaryBackground: '#D4AF37',
    primaryText: '#0F172A',
    secondaryBackground: '#122033',
    secondaryText: '#F8FAFC',
    disabledBackground: '#1A2A3D',
    disabledText: '#7A7A7A',
  },

  backgrounds: {
    background: '#081020',
    onBackground: '#F8FAFC',
    surface: '#122033',
    doodle: 'rgba(212, 175, 55, 0.055)',
    doodleOnDark: 'rgba(255, 255, 255, 0.1)',
  },

  ui: {
    border: '#243447',
    borderLight: '#122033',
    shadow: '#000000',
    card: '#122033',
    backdrop: 'rgba(0, 0, 0, 0.6)',
  },

  status: {
    success: '#3DD68C',
    error: '#FF6369',
    warning: '#FFC453',
    info: '#70B8FF',
  },

  navigation: {
    activeTint: '#D4AF37',
    inactiveTint: '#64748B',
    background: '#081020',
  },

  gradient: {
    header: ['#060B14', '#1A2A45'],
    profile: ['#060B14', '#122033'],
    skeleton: ['#1A2A3D', '#0E1A2A'],
  },
};

export type ThemeType = ThemeColors;
