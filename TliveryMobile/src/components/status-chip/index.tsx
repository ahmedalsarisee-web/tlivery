import {useMemo, type FC} from 'react';
import {StyleSheet, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {
  BadgeCheck,
  Clock3,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {fontSize, radius, statusSoftFor} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {
  getAlignSelf,
  getFlexDirection,
} from '@app/utils/directionalStyles';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type StatusChipTone =
  | 'waiting'
  | 'accepted'
  | 'onTheWay'
  | 'delivered'
  | 'cancelled';

const toneIcon: Record<StatusChipTone, LucideIcon> = {
  waiting: Clock3,
  accepted: BadgeCheck,
  onTheWay: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

type StatusChipProps = {
  label: string;
  tone?: StatusChipTone;
};

const StatusChip: FC<StatusChipProps> = ({label, tone = 'waiting'}) => {
  const {themeType} = useTheme();
  const {direction} = useLanguage();
  const soft = statusSoftFor(themeType)[tone];
  const Icon = toneIcon[tone];
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          alignSelf: getAlignSelf(direction),
          minHeight: getHeight(24),
          paddingHorizontal: getWidth(8),
          paddingVertical: getHeight(3),
          borderRadius: radius.pill,
          backgroundColor: soft.bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: getFlexDirection(direction),
          gap: getWidth(4),
        },
        label: {
          color: soft.fg,
          fontSize: fontSize.label,
          letterSpacing: 0.2,
          maxWidth: getWidth(120),
          ...cairoFont('bold'),
        },
      }),
    [direction, soft.bg, soft.fg],
  );

  return (
    <View style={styles.chip}>
      <Icon size={12} color={soft.fg} strokeWidth={2.4} />
      <AppText style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
};

export default StatusChip;
