import {useMemo, type FC, type ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {
  getFlexDirection,
  getTextAlign,
} from '@app/utils/directionalStyles';
import {fontSize, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getWidth} from '@app/utils/responsive-design';

type SectionHeaderProps = {
  title: string;
  icon?: ReactNode;
};

const SectionHeader: FC<SectionHeaderProps> = ({title, icon}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: getWidth(space.sm),
          marginBottom: getWidth(space.xs),
        },
        row: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          gap: getWidth(space.xs),
        },
        icon: {
          width: getWidth(28),
          height: getWidth(28),
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          flex: 1,
          fontSize: fontSize.section,
          textAlign: getTextAlign(direction),
          color: theme.typography.primary,
          ...cairoFont('medium'),
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          width: '100%',
          backgroundColor: theme.ui.border,
        },
      }),
    [direction, theme.typography.primary, theme.ui.border],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <AppText style={styles.title}>{title}</AppText>
      </View>
      <View style={styles.divider} />
    </View>
  );
};

export default SectionHeader;
