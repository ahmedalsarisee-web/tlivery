import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {elevation, radius, space} from '@app/theme/tokens';
import {getWidth} from '@app/utils/responsive-design';

export const cardStyles = (theme: ThemeType) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.ui.border,
      paddingVertical: getWidth(space.sm),
      paddingHorizontal: getWidth(space.md),
      gap: getWidth(space.xs),
      ...elevation.card,
    },
    pressed: {
      opacity: 0.92,
    },
  });
