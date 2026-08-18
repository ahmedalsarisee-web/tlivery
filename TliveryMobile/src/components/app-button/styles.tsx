import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {control, elevation, fontSize, radius, space} from '@app/theme/tokens';
import {getWidth} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';

export const appButtonStyles = (
  theme: ThemeType,
  _direction: LangDirection,
  _themeType: 'light' | 'dark',
) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.md,
      paddingVertical: getWidth(space.xs),
      paddingHorizontal: getWidth(space.lg),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      overflow: 'hidden',
      minHeight: control.height,
    },
    content: {
      minHeight: getWidth(space.lg),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: getWidth(space.xs),
    },
    primary: {
      backgroundColor: theme.button.primaryBackground,
      borderColor: theme.button.primaryBackground,
      ...elevation.button,
    },
    secondary: {
      backgroundColor: theme.button.secondaryBackground,
      borderColor: theme.ui.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    destructive: {
      backgroundColor: theme.status.error,
      borderColor: theme.status.error,
    },
    gold: {
      backgroundColor: theme.brand.gold,
      borderColor: theme.brand.gold,
      ...elevation.button,
    },
    disabled: {
      backgroundColor: theme.button.disabledBackground,
      borderColor: theme.button.disabledBackground,
      opacity: 1,
    },
    label: {
      fontSize: fontSize.body,
      ...cairoFont('bold'),
    },
    labelPrimary: {
      color: theme.button.primaryText,
    },
    labelSecondary: {
      color: theme.button.secondaryText,
    },
    labelGhost: {
      color: theme.typography.primary,
    },
    labelDestructive: {
      color: theme.base.white,
    },
    labelGold: {
      color: theme.brand.navy,
    },
  });
