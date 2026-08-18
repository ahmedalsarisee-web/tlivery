import {type FC, type ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {fontSize, radius} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

const FLAG_H = Math.round(getHeight(22));

type CornerFlagBadgeProps = {
  label: string;
  backgroundColor: string;
  color: string;
  icon?: ReactNode;
};

/**
 * Corner ribbon badge — trailing corner of the card
 * (physical right in LTR, physical left in RTL).
 */
const CornerFlagBadge: FC<CornerFlagBadgeProps> = ({
  label,
  backgroundColor,
  color,
  icon,
}) => {
  const {direction} = useLanguage();
  const rtl = isRTL(direction);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        rtl ? styles.anchorStart : styles.anchorEnd,
        {backgroundColor, flexDirection: getFlexDirection(direction)},
        rtl ? styles.bodyRtl : styles.bodyLtr,
      ]}>
      {icon}
      <AppText style={[styles.label, {color}]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    zIndex: 3,
    height: FLAG_H,
    paddingHorizontal: getWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    gap: getWidth(3),
  },
  anchorEnd: {
    right: 0,
  },
  anchorStart: {
    left: 0,
  },
  bodyLtr: {
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: radius.sm,
  },
  bodyRtl: {
    borderTopLeftRadius: radius.md,
    borderBottomRightRadius: radius.sm,
  },
  label: {
    fontSize: fontSize.label,
    lineHeight: fontSize.label + 2,
    ...cairoFont('bold'),
  },
});

export default CornerFlagBadge;
