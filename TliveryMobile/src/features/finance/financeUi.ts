import type {ThemeType} from '@app/theme/theme';

/** Accounting palette: debit/AR = teal, credit/AP = bronze-gold, settled = forest. */
export const financeColors = (isDark: boolean) => ({
  debit: isDark ? '#5EEAD4' : '#0F766E',
  credit: isDark ? '#E8C547' : '#A16207',
  settled: isDark ? '#6EE7B7' : '#047857',
  netNeg: isDark ? '#FCA5A5' : '#9F1239',
  debitSoft: isDark ? 'rgba(45, 212, 191, 0.16)' : '#F0FDFA',
  creditSoft: isDark ? 'rgba(212, 175, 55, 0.16)' : '#FFFBEB',
  settledSoft: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
  gold: '#D4AF37',
  navy: isDark ? '#0B1220' : '#0F172A',
  navyFg: '#F8FAFC',
  hairline: isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0',
});

export const financeSheet = (theme: ThemeType, isDark: boolean) => ({
  backgroundColor: theme.backgrounds.surface,
  borderColor: isDark ? 'rgba(255,255,255,0.10)' : theme.ui.border,
  borderWidth: 1,
  overflow: 'hidden' as const,
});
