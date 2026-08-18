import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, space} from '@app/theme/tokens';
import {getHeight} from '@app/utils/responsive-design';

export const orderPlacerDetailsStyles = (
  theme: ThemeType,
  direction: LangDirection,
) =>
  StyleSheet.create({
    flex: {flex: 1},
    sectionTitle: {
      fontSize: fontSize.cardTitle,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    sectionHint: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('regular'),
      textAlign: getTextAlign(direction),
      marginTop: getHeight(2),
    },
    headerBlock: {
      marginBottom: getHeight(space.sm),
    },
  });
