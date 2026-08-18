import {Platform, StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {control, fontSize, radius, space} from '@app/theme/tokens';
import {getWidth} from '@app/utils/responsive-design';
import {getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

const INPUT_HEIGHT = control.height;

export const appTextInputStyles = (
  theme: ThemeType,
  direction: LangDirection,
) =>
  StyleSheet.create({
    inputWrap: {
      position: 'relative',
      justifyContent: 'center',
      minHeight: INPUT_HEIGHT,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.ui.border,
      borderRadius: radius.md,
      paddingHorizontal: getWidth(space.md),
      paddingVertical: 0,
      height: INPUT_HEIGHT,
      color: theme.typography.primary,
      fontSize: fontSize.body,
      lineHeight: fontSize.body + 4,
      textAlign: getTextAlign(direction),
      textAlignVertical: 'center',
      backgroundColor: theme.backgrounds.surface,
      ...cairoFont('regular'),
      ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
    },
    inputWithEnd: {
      paddingEnd: getWidth(48),
    },
    inputWithStart: {
      paddingStart: getWidth(48),
    },
    startAdornment: {
      position: 'absolute',
      start: getWidth(space.sm),
      top: 0,
      bottom: 0,
      height: INPUT_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    endAdornment: {
      position: 'absolute',
      end: getWidth(space.sm),
      top: 0,
      bottom: 0,
      height: INPUT_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    focused: {
      borderColor: theme.brand.navy,
    },
    errored: {
      borderColor: theme.typography.error,
    },
  });
