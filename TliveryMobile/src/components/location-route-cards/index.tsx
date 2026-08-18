import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {Check} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type LocationRouteCardItem = {
  key: string;
  label: string;
  summary?: string | null;
  filled: boolean;
  Icon: LucideIcon;
  onPress: () => void;
};

type Props = {
  items: [LocationRouteCardItem, LocationRouteCardItem];
};

const CIRCLE = getWidth(84);

const LocationRouteCards: FC<Props> = ({items}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isDark = themeType === 'dark';
  const bothFilled = items[0].filled && items[1].filled;
  const onColor = theme.status.success;
  const offBg = isDark ? 'rgba(255,255,255,0.06)' : '#E8EDF5';
  const offBorder = isDark ? 'rgba(255,255,255,0.12)' : '#C5D0E0';
  const offIcon = isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: getHeight(space.sm),
          paddingHorizontal: getWidth(space.xs),
        },
        circlesRow: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          justifyContent: 'center',
        },
        labelsRow: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        },
        circleSlot: {
          width: CIRCLE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        labelSlot: {
          width: CIRCLE,
          alignItems: 'center',
          gap: getHeight(4),
        },
        circle: {
          width: CIRCLE,
          height: CIRCLE,
          borderRadius: CIRCLE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2.5,
        },
        circleOff: {
          backgroundColor: offBg,
          borderColor: offBorder,
          opacity: 0.72,
        },
        circleOn: {
          backgroundColor: onColor,
          borderColor: onColor,
          opacity: 1,
          shadowColor: onColor,
          shadowOpacity: isDark ? 0.55 : 0.35,
          shadowRadius: 14,
          shadowOffset: {width: 0, height: 4},
          elevation: 6,
        },
        connector: {
          flex: 1,
          height: CIRCLE,
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: getWidth(space.sm),
        },
        connectorSpacer: {
          flex: 1,
          marginHorizontal: getWidth(space.sm),
        },
        line: {
          position: 'absolute',
          start: 0,
          end: 0,
          height: 3,
          borderRadius: 99,
        },
        lineOff: {
          backgroundColor: offBorder,
          opacity: 0.7,
        },
        lineOn: {
          backgroundColor: onColor,
          opacity: 1,
        },
        lineCheck: {
          width: getWidth(22),
          height: getWidth(22),
          borderRadius: getWidth(11),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: onColor,
          borderWidth: 2,
          borderColor: isDark ? theme.backgrounds.surface : '#FFFFFF',
          zIndex: 1,
        },
        label: {
          fontSize: fontSize.body,
          color: theme.typography.primary,
          textAlign: 'center',
          ...cairoFont('bold'),
        },
        labelOn: {
          color: onColor,
        },
        summary: {
          fontSize: fontSize.caption,
          color: theme.typography.secondary,
          textAlign: 'center',
          ...cairoFont('medium'),
          minHeight: getHeight(34),
        },
        summaryOn: {
          color: theme.typography.primary,
        },
      }),
    [direction, isDark, offBg, offBorder, onColor, theme],
  );

  const renderCircle = (item: LocationRouteCardItem) => {
    const Icon = item.Icon;
    return (
      <Pressable
        key={`circle-${item.key}`}
        accessibilityRole="button"
        accessibilityState={{selected: item.filled}}
        onPress={item.onPress}
        style={styles.circleSlot}>
        <View
          style={[
            styles.circle,
            item.filled ? styles.circleOn : styles.circleOff,
          ]}>
          <Icon
            color={item.filled ? '#FFFFFF' : offIcon}
            size={32}
            strokeWidth={item.filled ? 2.4 : 2}
          />
        </View>
      </Pressable>
    );
  };

  const renderLabels = (item: LocationRouteCardItem) => (
    <Pressable
      key={`label-${item.key}`}
      accessibilityRole="button"
      onPress={item.onPress}
      style={styles.labelSlot}>
      <AppText
        style={[styles.label, item.filled && styles.labelOn]}
        numberOfLines={1}>
        {item.label}
      </AppText>
      <AppText
        style={[styles.summary, item.filled && styles.summaryOn]}
        numberOfLines={2}>
        {item.filled ? item.summary ?? '' : '—'}
      </AppText>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={styles.circlesRow}>
        {renderCircle(items[0])}
        <View style={styles.connector} pointerEvents="none">
          <View
            style={[
              styles.line,
              bothFilled ? styles.lineOn : styles.lineOff,
            ]}
          />
          {bothFilled ? (
            <View style={styles.lineCheck}>
              <Check color="#FFFFFF" size={12} strokeWidth={3} />
            </View>
          ) : null}
        </View>
        {renderCircle(items[1])}
      </View>

      <View style={styles.labelsRow}>
        {renderLabels(items[0])}
        <View style={styles.connectorSpacer} />
        {renderLabels(items[1])}
      </View>
    </View>
  );
};

export default LocationRouteCards;
