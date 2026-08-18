import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const orderDetailsStyles = (
  theme: ThemeType,
  _direction: LangDirection,
  _themeType: 'light' | 'dark',
) => {
  return StyleSheet.create({
    headerMeta: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('bold'),
      marginTop: getHeight(2),
    },
    detailCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: theme.backgrounds.surface,
      padding: getWidth(space.md),
      gap: getHeight(space.sm),
    },
    detailRow: {
      gap: getHeight(2),
    },
    detailLabel: {
      fontSize: fontSize.label,
      color: theme.typography.caption,
      ...cairoFont('bold'),
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    detailValue: {
      fontSize: fontSize.body,
      color: theme.typography.primary,
      ...cairoFont('bold'),
    },
    sectionTitle: {
      fontSize: fontSize.cardTitle,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(_direction),
    },
    decisionBtn: {
      width: getWidth(44),
      height: getWidth(44),
      borderRadius: getWidth(22),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    decisionBtnAccept: {
      backgroundColor:
        _themeType === 'dark' ? 'rgba(34,197,94,0.22)' : '#E8F8EF',
      borderColor: theme.status.success,
    },
    decisionBtnReject: {
      backgroundColor:
        _themeType === 'dark' ? 'rgba(239,68,68,0.22)' : '#FEE2E2',
      borderColor: theme.status.error,
    },
    assignChip: {
      height: getWidth(36),
      borderRadius: getWidth(18),
      paddingHorizontal: getWidth(10),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor:
        _themeType === 'dark' ? 'rgba(37,99,235,0.28)' : '#E0EDFF',
    },
    assignChipText: {
      fontSize: fontSize.caption,
      color: _themeType === 'dark' ? '#93C5FD' : '#1D4ED8',
      ...cairoFont('bold'),
    },
  });
};
