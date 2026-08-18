import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize} from '@app/theme/tokens';
import {scaleFont} from '@app/utils/responsive-design';

export const appTextStyles = (theme: ThemeType, direction: LangDirection) =>
  StyleSheet.create({
    base: {
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },

    title: {fontSize: scaleFont(fontSize.screen), ...cairoFont('bold')},
    subtitle: {fontSize: scaleFont(fontSize.caption), ...cairoFont('bold')},
    heading: {fontSize: scaleFont(fontSize.cardTitle), ...cairoFont('bold')},
    body: {fontSize: scaleFont(fontSize.body), ...cairoFont('bold')},
    label: {fontSize: scaleFont(fontSize.body), ...cairoFont('bold')},
    caption: {fontSize: scaleFont(fontSize.caption), ...cairoFont('bold')},
    value: {fontSize: scaleFont(fontSize.heading), ...cairoFont('bold')},

    primary: {color: theme.typography.primary},
    secondary: {color: theme.typography.secondary},
    inverse: {color: theme.typography.inverse},
    error: {color: theme.typography.error},
  });
