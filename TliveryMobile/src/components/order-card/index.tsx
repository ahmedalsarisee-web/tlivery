import {useMemo, useState, type FC} from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Share,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  MapPin,
  Navigation,
  PackageCheck,
  PackagePlus,
  Phone,
  Store,
  Truck,
  User,
  XCircle,
} from 'lucide-react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import CenterModal from '@app/components/center-modal';
import Column from '@app/components/column';
import type {StatusChipTone} from '@app/components/status-chip';
import type {WaselOrder} from '@app/features/orders/types';
import {
  orderStatusTone,
  resolveOrderSource,
} from '@app/features/orders/orderStatus';
import {
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import {formatPublicLocationShort} from '@app/constants/jordanLocations';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {
  estimateRoadDistanceMeters,
  estimateTravelMinutes,
  formatDistanceLabel,
} from '@app/utils/geo';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {space} from '@app/theme/tokens';
import {orderCardStyles} from './styles';

export {orderStatusTone} from '@app/features/orders/orderStatus';

type OrderCardProps = {
  order: WaselOrder;
  onPress: () => void;
  onTrackMap?: () => void;
  onPressPlacer?: () => void;
  variant?: 'default' | 'driver';
  canReceive?: boolean;
  receiving?: boolean;
  onReceive?: () => void;
};

const toneIcon: Record<StatusChipTone, LucideIcon> = {
  waiting: Clock3,
  accepted: Truck,
  onTheWay: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

/** Mobile logistics palette (Pending gray → Assigned purple → On delivery blue). */
const statusPalette = (
  tone: StatusChipTone,
  isDark: boolean,
): {bg: string; fg: string} => {
  switch (tone) {
    case 'delivered':
      return isDark
        ? {bg: 'rgba(34,197,94,0.24)', fg: '#86EFAC'}
        : {bg: '#DCFCE7', fg: '#15803D'};
    case 'cancelled':
      return isDark
        ? {bg: 'rgba(239,68,68,0.24)', fg: '#FCA5A5'}
        : {bg: '#FEE2E2', fg: '#B91C1C'};
    case 'onTheWay':
      return isDark
        ? {bg: 'rgba(59,130,246,0.28)', fg: '#93C5FD'}
        : {bg: '#DBEAFE', fg: '#1D4ED8'};
    case 'accepted':
      return isDark
        ? {bg: 'rgba(168,85,247,0.28)', fg: '#D8B4FE'}
        : {bg: '#F3E8FF', fg: '#7E22CE'};
    case 'waiting':
    default:
      return isDark
        ? {bg: 'rgba(148,163,184,0.24)', fg: '#CBD5E1'}
        : {bg: '#F1F5F9', fg: '#475569'};
  }
};

function openLocationInMaps(lat?: number | null, lng?: number | null) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  const query = `${lat},${lng}`;
  const googleWeb = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const appUrl =
    Platform.OS === 'ios'
      ? `comgooglemaps://?q=${encodeURIComponent(query)}`
      : `google.navigation:q=${encodeURIComponent(query)}`;
  Linking.openURL(appUrl).catch(() => {
    Linking.openURL(googleWeb).catch(() => {});
  });
  return true;
}

async function dialPhone(
  phone: string | null | undefined,
  missingMsg: string,
  failMsg: string,
) {
  const cleaned = phone?.replace(/\s+/g, '') ?? '';
  if (!cleaned) {
    showToast(ToastType.info, missingMsg);
    return;
  }
  try {
    await Linking.openURL(`tel:${cleaned}`);
  } catch {
    showToast(ToastType.error, failMsg);
  }
}

function formatOrderAge(iso: string, locale: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) {
    return '—';
  }
  const diffMs = Date.now() - then;
  const absSec = Math.max(0, Math.round(Math.abs(diffMs) / 1000));
  const isAr = locale.toLowerCase().startsWith('ar');

  if (absSec < 60) {
    return isAr ? 'الآن' : 'just now';
  }
  if (absSec < 3600) {
    const m = Math.round(absSec / 60);
    return isAr ? `قبل ${m} د` : `${m}m ago`;
  }
  if (absSec < 86400) {
    const h = Math.round(absSec / 3600);
    return isAr ? `قبل ${h} س` : `${h}h ago`;
  }
  const d = Math.round(absSec / 86400);
  return isAr ? `قبل ${d} ي` : `${d}d ago`;
}

const OrderCard: FC<OrderCardProps> = ({
  order,
  onPress,
  onTrackMap,
  onPressPlacer,
  variant = 'default',
  canReceive = false,
  receiving = false,
  onReceive,
}) => {
  const {t, i18n} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const role = useUserStore(selectUserRole);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const styles = useMemo(
    () => orderCardStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const isDark = themeType === 'dark';
  const tone = orderStatusTone(order.status);
  const statusColors = statusPalette(tone, isDark);
  const StatusIcon = toneIcon[tone];
  const statusLabel = t(`orderStatus_${order.status}`);
  const source = resolveOrderSource(order.createdByRole);
  const placerRoleLabel =
    source === 'company'
      ? t('orderSourceCompany')
      : order.createdByRole === 'merchant'
        ? t('orderSourceMerchant')
        : t('orderSourceClient');
  /** Company-placed: show the client the order was created for (recipient). Account-placed: placer name. */
  const placerPersonName =
    source === 'company'
      ? order.customerName?.trim() || ''
      : order.createdByName?.trim() || '';
  const placerLine =
    source === 'company'
      ? placerPersonName || placerRoleLabel
      : placerPersonName
        ? `${placerRoleLabel} ${placerPersonName}`
        : placerRoleLabel;
  const recipientName = order.customerName?.trim() || '—';
  const PlacerIcon =
    source === 'company'
      ? Building2
      : order.createdByRole === 'merchant'
        ? Store
        : User;
  const iconMuted = theme.typography.caption;
  const iconAccent =
    themeType === 'dark' ? theme.brand.gold : theme.brand.navy;
  const routeArrowColor =
    themeType === 'dark' ? theme.brand.navy : theme.typography.inverse;
  const actionIconSecondary = iconAccent;
  const actionIconPrimary =
    themeType === 'dark' ? theme.brand.navy : theme.typography.inverse;
  const receiveIconColor = actionIconPrimary;

  const amountLabel = `${order.amountJod.toFixed(2)} ${t('jod')}`;
  const paymentLabel = order.isCod ? t('cod') : t('paymentPrepaid');
  const driverName = order.driverName?.trim() || t('awaitingDriver');
  const orderAge = useMemo(
    () => formatOrderAge(order.createdAt, i18n.language || 'en'),
    [order.createdAt, i18n.language],
  );

  const routeMeters = useMemo(() => {
    const pickup = order.pickupLocation;
    const dropoff = order.dropoffLocation;
    if (
      typeof pickup?.lat !== 'number' ||
      typeof pickup?.lng !== 'number' ||
      typeof dropoff?.lat !== 'number' ||
      typeof dropoff?.lng !== 'number'
    ) {
      return null;
    }
    return estimateRoadDistanceMeters(
      {latitude: pickup.lat, longitude: pickup.lng},
      {latitude: dropoff.lat, longitude: dropoff.lng},
    );
  }, [order.pickupLocation, order.dropoffLocation]);

  const distanceLabel =
    routeMeters != null ? formatDistanceLabel(routeMeters) : '—';
  const etaMinutes =
    typeof order.etaMinutes === 'number' && order.etaMinutes > 0
      ? order.etaMinutes
      : routeMeters != null
        ? estimateTravelMinutes(routeMeters)
        : null;
  const timeLabel =
    etaMinutes != null ? t('etaMinShort', {minutes: etaMinutes}) : '—';

  const dropoffLat = order.dropoffLocation?.lat;
  const dropoffLng = order.dropoffLocation?.lng;
  const hasDropoffCoords =
    typeof dropoffLat === 'number' && typeof dropoffLng === 'number';
  const isDriverViewer = variant === 'driver' || role === 'driver';

  const onCallCustomer = () => {
    void dialPhone(
      order.customerPhone,
      t('phoneUnavailable'),
      t('phoneOpenFailed'),
    );
  };

  const onCallDriver = () => {
    void dialPhone(
      order.driverPhone,
      t('phoneUnavailable'),
      t('phoneOpenFailed'),
    );
  };

  const onPressCall = () => {
    setCallModalOpen(true);
  };

  const callTargets: Array<{
    key: string;
    title: string;
    subtitle: string;
    Icon: LucideIcon;
    onCall: () => void;
  }> = [
    {
      key: 'recipient',
      title: t('callRecipient'),
      subtitle: order.customerName?.trim() || '—',
      Icon: User,
      onCall: onCallCustomer,
    },
  ];
  if (!isDriverViewer) {
    callTargets.push({
      key: 'driver',
      title: t('callDriver'),
      subtitle: order.driverName?.trim() || t('awaitingDriver'),
      Icon: Truck,
      onCall: onCallDriver,
    });
  }

  const onOpenMap = () => {
    if (hasDropoffCoords) {
      openLocationInMaps(dropoffLat, dropoffLng);
      return;
    }
    (onTrackMap ?? onPress)();
  };

  const onCopyReference = () => {
    void Share.share({message: order.reference}).catch(() => {});
  };

  const rowDir = getFlexDirection(direction);
  const rtl = isRTL(direction);
  const PlacerChevron = rtl ? ChevronLeft : ChevronRight;
  const locale: 'ar' | 'en' = rtl ? 'ar' : 'en';
  const fromLabel = formatPublicLocationShort(
    order.pickupLocation,
    locale,
    order.pickupAddress,
  );
  const toLabel = formatPublicLocationShort(
    order.dropoffLocation,
    locale,
    order.dropoffAddress,
  );

  const canOpenPlacer =
    source === 'account' &&
    Boolean(onPressPlacer) &&
    Boolean(order.createdByUserId?.trim());

  const detailsBox = (
    <View style={styles.tripBlock}>
      <View style={[styles.headerRow, {flexDirection: rowDir}]}>
        <View style={[styles.headerSide, {flexDirection: rowDir}]}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: statusColors.bg, flexDirection: rowDir},
            ]}>
            <StatusIcon size={10} color={statusColors.fg} strokeWidth={2.4} />
            <AppText
              style={[styles.statusBadgeText, {color: statusColors.fg}]}
              numberOfLines={1}>
              {statusLabel}
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('copyInviteCode')}
          onPress={onCopyReference}
          hitSlop={6}
          style={[styles.refBadge, {flexDirection: rowDir}]}>
          <AppText style={styles.reference} numberOfLines={1}>
            {order.reference}
          </AppText>
          <Copy size={10} color={iconMuted} strokeWidth={2.2} />
        </Pressable>

        <View
          style={[
            styles.headerSide,
            styles.headerSideEnd,
            {flexDirection: rowDir},
          ]}>
          <View style={[styles.ageRow, {flexDirection: rowDir}]}>
            <Clock3 size={10} color={iconMuted} strokeWidth={2.2} />
            <AppText style={styles.ageText} numberOfLines={1}>
              {orderAge}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.tripDivider} />

      <View style={styles.factsBlock}>
        {canOpenPlacer ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('orderPartyPlacer')}
            onPress={() => {
              onPressPlacer?.();
            }}
            style={[
              styles.factRow,
              styles.factRowClickable,
              {flexDirection: rowDir},
            ]}>
            <View style={[styles.factLabelWrap, {flexDirection: rowDir}]}>
              <PlacerIcon size={11} color={iconAccent} strokeWidth={2.2} />
              <AppText
                style={[styles.factLabel, styles.factLabelClickable]}
                numberOfLines={1}>
                {t('orderPartyPlacer')}
              </AppText>
            </View>
            <AppText style={[styles.factSep, styles.factSepClickable]}>
              :
            </AppText>
            <AppText
              style={[styles.factValue, styles.factValueClickable]}
              numberOfLines={1}>
              {placerLine}
            </AppText>
            <PlacerChevron
              size={14}
              color={iconAccent}
              strokeWidth={2.4}
            />
          </Pressable>
        ) : (
          <View style={[styles.factRow, {flexDirection: rowDir}]}>
            <View style={[styles.factLabelWrap, {flexDirection: rowDir}]}>
              <PlacerIcon size={11} color={iconMuted} strokeWidth={2.2} />
              <AppText style={styles.factLabel} numberOfLines={1}>
                {t('orderPartyPlacer')}
              </AppText>
            </View>
            <AppText style={styles.factSep}>:</AppText>
            <AppText style={styles.factValue} numberOfLines={1}>
              {placerLine}
            </AppText>
          </View>
        )}

        <View style={[styles.factRow, {flexDirection: rowDir}]}>
          <View style={[styles.factLabelWrap, {flexDirection: rowDir}]}>
            <User size={11} color={iconMuted} strokeWidth={2.2} />
            <AppText style={styles.factLabel} numberOfLines={1}>
              {t('orderPartyRecipient')}
            </AppText>
          </View>
          <AppText style={styles.factSep}>:</AppText>
          <AppText style={styles.factValue} numberOfLines={1}>
            {recipientName}
          </AppText>
        </View>

        <View style={[styles.factRow, {flexDirection: rowDir}]}>
          <View style={[styles.factLabelWrap, {flexDirection: rowDir}]}>
            <Truck size={11} color={iconMuted} strokeWidth={2.2} />
            <AppText style={styles.factLabel} numberOfLines={1}>
              {t('driver')}
            </AppText>
          </View>
          <AppText style={styles.factSep}>:</AppText>
          <AppText style={styles.factValue} numberOfLines={1}>
            {driverName}
          </AppText>
          <View
            style={[
              styles.paymentBadge,
              !order.isCod && styles.paymentBadgeMuted,
            ]}>
            <AppText
              style={[
                styles.paymentText,
                !order.isCod && styles.paymentTextMuted,
              ]}
              numberOfLines={1}>
              {paymentLabel}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.tripDivider} />

      <View style={[styles.metricsRow, {flexDirection: rowDir}]}>
        <View style={[styles.metricCell, {flexDirection: rowDir}]}>
          <Clock3 size={12} color={iconMuted} strokeWidth={2.2} />
          <AppText style={styles.metricText} numberOfLines={1}>
            {timeLabel}
          </AppText>
        </View>
        <View style={styles.metricDivider} />
        <View style={[styles.metricCell, {flexDirection: rowDir}]}>
          <MapPin size={12} color={iconMuted} strokeWidth={2.2} />
          <AppText style={styles.metricText} numberOfLines={1}>
            {distanceLabel}
          </AppText>
        </View>
        <View style={styles.metricDivider} />
        <View style={[styles.metricCell, styles.metricCellAmount]}>
          <AppText
            style={[styles.metricText, styles.metricAmount]}
            numberOfLines={1}>
            {amountLabel}
          </AppText>
        </View>
      </View>

      <View style={styles.tripDivider} />

      <View style={[styles.routeRow, {flexDirection: rowDir}]}>
        <View style={[styles.routeEndpoint, {flexDirection: rowDir}]}>
          <View style={[styles.addressDot, styles.addressDotPickup]} />
          <AppText
            style={styles.routeEndpointText}
            numberOfLines={1}
            ellipsizeMode="tail">
            {fromLabel}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('openInMaps')}
          onPress={onOpenMap}
          hitSlop={6}
          style={styles.routeArrowWrap}>
          <Navigation size={12} color={routeArrowColor} strokeWidth={2.4} />
        </Pressable>
        <View style={[styles.routeEndpoint, {flexDirection: rowDir}]}>
          <View style={[styles.addressDot, styles.addressDotDropoff]} />
          <AppText
            style={styles.routeEndpointText}
            numberOfLines={1}
            ellipsizeMode="tail">
            {toLabel}
          </AppText>
        </View>
      </View>
    </View>
  );

  const callLabel = t('callContact');

  const callButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={callLabel}
      disabled={receiving}
      onPress={onPressCall}
      style={[styles.actionBtn, styles.callActionBtn, {flexDirection: rowDir}]}
      hitSlop={4}>
      <Phone size={13} color={actionIconSecondary} strokeWidth={2.2} />
      <AppText style={styles.actionLabel} numberOfLines={1}>
        {callLabel}
      </AppText>
    </Pressable>
  );

  const defaultActions = (
    <View style={[styles.footer, {flexDirection: rowDir}]}>
      {callButton}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('viewDetails')}
        onPress={onPress}
        style={[styles.actionBtn, styles.actionBtnPrimary]}
        hitSlop={4}>
        <AppText
          style={[styles.actionLabel, styles.actionLabelPrimary]}
          numberOfLines={1}>
          {t('viewDetails')}
        </AppText>
      </Pressable>
    </View>
  );

  const driverActions = (
    <View style={[styles.footer, {flexDirection: rowDir}]}>
      {callButton}

      {canReceive ? (
        <Pressable
          accessibilityRole="button"
          disabled={receiving}
          onPress={onReceive}
          style={[
            styles.driverReceiveBtn,
            receiving && styles.driverReceiveBtnBusy,
          ]}>
          {receiving ? (
            <ActivityIndicator size="small" color={receiveIconColor} />
          ) : (
            <>
              <PackagePlus
                size={13}
                color={receiveIconColor}
                strokeWidth={2.3}
              />
              <AppText style={styles.driverReceiveLabel} numberOfLines={1}>
                {t('receiveOrder')}
              </AppText>
            </>
          )}
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          hitSlop={4}>
          <AppText
            style={[styles.actionLabel, styles.actionLabelPrimary]}
            numberOfLines={1}>
            {t('viewDetails')}
          </AppText>
        </Pressable>
      )}
    </View>
  );

  return (
    <Card
      style={[
        styles.card,
        source === 'account'
          ? styles.cardFromAccount
          : styles.cardFromCompany,
      ]}>
      <Pressable onPress={onPress} disabled={receiving} style={styles.body}>
        {detailsBox}
      </Pressable>
      <View style={styles.footerWrap}>
        {variant === 'driver' ? driverActions : defaultActions}
      </View>

      <CenterModal
        visible={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        title={t('callChooseTitle')}>
        <Column gap={space.sm}>
          <AppText variant="body" tone="secondary">
            {t('callChooseBody')}
          </AppText>
          {callTargets.map(target => (
            <Pressable
              key={target.key}
              accessibilityRole="button"
              onPress={() => {
                setCallModalOpen(false);
                target.onCall();
              }}
              style={[styles.callOptionBtn, {flexDirection: rowDir}]}>
              <target.Icon size={16} color={iconAccent} strokeWidth={2.2} />
              <View style={styles.callOptionTextCol}>
                <AppText style={styles.callOptionTitle} numberOfLines={1}>
                  {target.title}
                </AppText>
                <AppText style={styles.callOptionSub} numberOfLines={1}>
                  {target.subtitle}
                </AppText>
              </View>
              <Phone size={15} color={iconMuted} strokeWidth={2.2} />
            </Pressable>
          ))}
        </Column>
      </CenterModal>
    </Card>
  );
};

export default OrderCard;
