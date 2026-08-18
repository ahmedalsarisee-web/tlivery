import {type FC, useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Navigation, Package, Phone, X} from 'lucide-react-native';
import type {DriverLiveLocation} from '@app/models/tracking.model';
import type {CompanyDriver} from '@app/features/company/types';
import AppText from '@app/components/app-text';
import {mapAccent} from './mapTheme';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {radius, space} from '@app/theme/tokens';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {getFlexDirection, getTextAlign, isRTL} from '@app/utils/directionalStyles';

type Props = {
  location: DriverLiveLocation;
  driver?: CompanyDriver | null;
  onClose?: () => void;
  onOpenDetails?: () => void;
};

const FleetDriverInfoCard: FC<Props> = ({
  location,
  driver,
  onClose,
  onOpenDetails,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : mapAccent.forest;
  const rtl = isRTL(direction);
  const onTrip = Boolean(location.orderId);
  const activeOrders = driver?.activeOrders ?? (onTrip ? 1 : 0);
  const name =
    location.driverName?.trim() ||
    driver?.fullName?.trim() ||
    t('driver');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: getHeight(space.xs),
        },
        header: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: getWidth(space.sm),
        },
        headerText: {
          flex: 1,
          gap: getHeight(2),
        },
        title: {
          color: theme.typography.primary,
          textAlign: getTextAlign(direction),
        },
        closeBtn: {
          width: getWidth(32),
          height: getWidth(32),
          borderRadius: getWidth(16),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark
            ? theme.backgrounds.background
            : theme.backgrounds.background,
          borderWidth: 1,
          borderColor: theme.ui.border,
        },
        badge: {
          alignSelf: rtl ? 'flex-end' : 'flex-start',
          paddingHorizontal: getWidth(space.sm),
          paddingVertical: getHeight(3),
          borderRadius: radius.sm,
          backgroundColor: onTrip ? '#D4A017' : accent,
        },
        badgeText: {
          color: onTrip || isDark ? '#0F172A' : '#fff',
        },
        stats: {
          flexDirection: getFlexDirection(direction),
          gap: getWidth(space.sm),
          marginTop: getHeight(4),
        },
        stat: {
          flex: 1,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.ui.border,
          backgroundColor: isDark
            ? theme.backgrounds.background
            : theme.backgrounds.background,
          padding: getWidth(space.sm),
          gap: getHeight(4),
        },
        statValue: {
          color: theme.typography.primary,
          textAlign: getTextAlign(direction),
        },
        metaRow: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          gap: getWidth(6),
        },
        link: {
          marginTop: getHeight(4),
          color: accent,
          textAlign: getTextAlign(direction),
        },
      }),
    [theme, themeType, onTrip, direction, isDark, accent, rtl],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="heading" style={styles.title}>
            {name}
          </AppText>
          <View style={styles.badge}>
            <AppText variant="caption" style={styles.badgeText}>
              {onTrip ? t('fleetDriverOnTrip') : t('fleetDriverAvailable')}
            </AppText>
          </View>
        </View>
        {onClose ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={8}>
            <X size={16} color={theme.typography.secondary} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Package size={16} color={accent} strokeWidth={2.2} />
          <AppText variant="caption" tone="secondary">
            {t('fleetActiveOrders')}
          </AppText>
          <AppText variant="heading" style={styles.statValue}>
            {activeOrders}
          </AppText>
        </View>
        <View style={styles.stat}>
          <Navigation size={16} color={accent} strokeWidth={2.2} />
          <AppText variant="caption" tone="secondary">
            {t('fleetSpeed')}
          </AppText>
          <AppText variant="heading" style={styles.statValue}>
            {Number.isFinite(location.speed)
              ? t('fleetSpeedKmh', {
                  speed: Math.max(0, Math.round(location.speed * 3.6)),
                })
              : '—'}
          </AppText>
        </View>
      </View>

      {driver?.phone ? (
        <View style={styles.metaRow}>
          <Phone size={14} color={theme.typography.secondary} strokeWidth={2} />
          <AppText variant="caption" tone="secondary">
            {driver.phone}
          </AppText>
        </View>
      ) : null}

      {driver?.vehicleType ? (
        <AppText variant="caption" tone="secondary">
          {t(`vehicle_${driver.vehicleType}`, {
            defaultValue: driver.vehicleType,
          })}
          {driver.plateNumber ? ` · ${driver.plateNumber}` : ''}
        </AppText>
      ) : null}

      {location.updatedAt ? (
        <AppText variant="caption" tone="secondary">
          {t('locationUpdatedAt', {
            time: new Date(location.updatedAt).toLocaleTimeString(),
          })}
        </AppText>
      ) : null}

      {onOpenDetails ? (
        <Pressable onPress={onOpenDetails} hitSlop={6}>
          <AppText variant="caption" style={styles.link}>
            {t('viewDriverDetails')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
};

export default FleetDriverInfoCard;
