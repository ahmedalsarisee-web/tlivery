import {useMemo, type FC} from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  Check,
  ClipboardList,
  Phone,
  Truck,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import type {StatusChipTone} from '@app/components/status-chip';
import type {WaselOrder} from '@app/features/orders/types';
import {
  orderStatusTone,
  statusesForListFilter,
} from '@app/features/orders/orderStatus';
import {formatPublicLocationShort} from '@app/constants/jordanLocations';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {companyOrderCardStyles} from './companyStyles';

type CompanyOrderCardProps = {
  order: WaselOrder;
  onPress: () => void;
  canDecide?: boolean;
  canCompletePickup?: boolean;
  canAssignDriver?: boolean;
  deciding?: 'accept' | 'reject' | 'pickup' | null;
  assigning?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCompletePickup?: () => void;
  onAssignDriver?: () => void;
  onShipmentDetails?: () => void;
  onSenderDetails?: () => void;
  onDriverDetails?: () => void;
};

function companyStatusLabelKey(status: WaselOrder['status']): string {
  if (statusesForListFilter('pending')?.includes(status)) {
    return 'orderFilter_pending';
  }
  if (statusesForListFilter('toReceive')?.includes(status)) {
    return 'orderFilter_toReceive';
  }
  if (statusesForListFilter('needsDriver')?.includes(status)) {
    return 'orderFilter_needsDriver';
  }
  if (statusesForListFilter('onTheWay', 'company_admin')?.includes(status)) {
    return 'orderFilter_onTheWay';
  }
  if (statusesForListFilter('delivered')?.includes(status)) {
    return 'orderFilter_delivered';
  }
  if (statusesForListFilter('cancelled')?.includes(status)) {
    return 'orderFilter_cancelled';
  }
  return `orderStatus_${status}`;
}

const statusPalette = (
  tone: StatusChipTone,
  isDark: boolean,
): {bg: string; fg: string; bar: string} => {
  switch (tone) {
    case 'delivered':
      return isDark
        ? {bg: 'rgba(34,197,94,0.22)', fg: '#86EFAC', bar: '#22C55E'}
        : {bg: '#E8F8EF', fg: '#15803D', bar: '#22C55E'};
    case 'cancelled':
      return isDark
        ? {bg: 'rgba(239,68,68,0.22)', fg: '#FCA5A5', bar: '#EF4444'}
        : {bg: '#FEE2E2', fg: '#DC2626', bar: '#EF4444'};
    case 'onTheWay':
      return isDark
        ? {bg: 'rgba(37,99,235,0.28)', fg: '#93C5FD', bar: '#3B82F6'}
        : {bg: '#E0EDFF', fg: '#1D4ED8', bar: '#3B82F6'};
    case 'accepted':
      return isDark
        ? {bg: 'rgba(168,85,247,0.26)', fg: '#D8B4FE', bar: '#A855F7'}
        : {bg: '#F3E8FF', fg: '#7E22CE', bar: '#A855F7'};
    case 'waiting':
    default:
      return isDark
        ? {bg: 'rgba(245,158,11,0.26)', fg: '#FCD34D', bar: '#F59E0B'}
        : {bg: '#FEF3C7', fg: '#B45309', bar: '#F59E0B'};
  }
};

const CompanyOrderCard: FC<CompanyOrderCardProps> = ({
  order,
  onPress,
  canDecide = false,
  canCompletePickup = false,
  canAssignDriver = false,
  deciding = null,
  assigning = false,
  onAccept,
  onReject,
  onCompletePickup,
  onAssignDriver,
  onShipmentDetails,
  onSenderDetails,
  onDriverDetails,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => companyOrderCardStyles(theme, direction, themeType),
    [direction, theme, themeType],
  );
  const isDark = themeType === 'dark';
  const rtl = isRTL(direction);
  const rowDir = getFlexDirection(direction);
  const tone = orderStatusTone(order.status);
  const colors = statusPalette(tone, isDark);
  const locale: 'ar' | 'en' = rtl ? 'ar' : 'en';
  const mutedIcon = '#64748B';
  const assignColor = isDark ? '#93C5FD' : '#1D4ED8';
  const decisionBusy = deciding != null || assigning;

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
  const customerName = order.customerName?.trim() || '—';
  const senderName =
    order.createdByName?.trim() || t('senderDetailsTitle');
  const isOnTheWay = Boolean(
    statusesForListFilter('onTheWay', 'company_admin')?.includes(order.status),
  );
  const isDelivered = Boolean(
    statusesForListFilter('delivered')?.includes(order.status),
  );
  const driverName = order.driverName?.trim() || '';
  const showDriverName = (isOnTheWay || isDelivered) && Boolean(driverName);
  const refLabel = order.reference?.startsWith('#')
    ? order.reference
    : `#${order.reference}`;
  const amountLabel = `${order.amountJod.toFixed(2)} ${t('jod')}`;
  const paymentLabel = order.isCod ? t('cod') : t('paymentCash');

  const onCall = () => {
    const cleaned = order.customerPhone?.replace(/\s+/g, '') ?? '';
    if (!cleaned) {
      showToast(ToastType.info, t('phoneUnavailable'));
      return;
    }
    void Linking.openURL(`tel:${cleaned}`).catch(() => {
      showToast(ToastType.error, t('phoneOpenFailed'));
    });
  };

  return (
    <View style={[styles.card, {borderStartColor: colors.bar}]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({pressed}) => [pressed && styles.cardPressed]}>
        <View style={[styles.topRow, {flexDirection: rowDir}]}>
          <View style={[styles.topStart, {flexDirection: rowDir}]}>
            <AppText style={styles.refText} numberOfLines={1}>
              {refLabel}
            </AppText>
            <View style={[styles.statusBadge, {backgroundColor: colors.bg}]}>
              <AppText
                style={[styles.statusText, {color: colors.fg}]}
                numberOfLines={1}>
                {t(companyStatusLabelKey(order.status))}
              </AppText>
            </View>
          </View>
          <AppText style={styles.amountText} numberOfLines={1}>
            {amountLabel}
          </AppText>
        </View>

        <View style={[styles.metaRow, {flexDirection: rowDir}]}>
          <AppText style={styles.customerText} numberOfLines={1}>
            {customerName}
          </AppText>
          <AppText style={styles.metaMuted} numberOfLines={1}>
            {paymentLabel}
          </AppText>
        </View>

        <View style={styles.routeBlock}>
          <View style={[styles.stopRow, {flexDirection: rowDir}]}>
            <View style={[styles.stopDot, {backgroundColor: '#2563EB'}]} />
            <AppText style={styles.stopText} numberOfLines={1}>
              {fromLabel || '—'}
            </AppText>
          </View>
          <View style={[styles.stopRow, {flexDirection: rowDir}]}>
            <View style={[styles.stopDot, {backgroundColor: '#EF4444'}]} />
            <AppText style={styles.stopText} numberOfLines={1}>
              {toLabel || '—'}
            </AppText>
          </View>
        </View>
      </Pressable>

      <View style={[styles.toolsRow, {flexDirection: rowDir}]}>
        <View style={[styles.toolsStart, {flexDirection: rowDir}]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('shipmentDetails')}
            onPress={onShipmentDetails ?? onPress}
            hitSlop={4}
            style={styles.toolBtn}>
            <ClipboardList color={mutedIcon} size={16} strokeWidth={2.3} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('senderDetailsTitle')}
            onPress={onSenderDetails}
            disabled={!onSenderDetails}
            hitSlop={4}
            style={[
              styles.senderChip,
              {flexDirection: rowDir},
              !onSenderDetails ? {opacity: 0.45} : null,
            ]}>
            <UserRound color={mutedIcon} size={14} strokeWidth={2.3} />
            <AppText style={styles.senderName} numberOfLines={1}>
              {senderName}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('callContact')}
            onPress={onCall}
            hitSlop={4}
            style={styles.toolBtn}>
            <Phone color={mutedIcon} size={15} strokeWidth={2.2} />
          </Pressable>
        </View>

        {canDecide || canCompletePickup || canAssignDriver || showDriverName ? (
          <View style={[styles.toolsEnd, {flexDirection: rowDir}]}>
            {canDecide ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('acceptOrder')}
                  disabled={decisionBusy}
                  onPress={onAccept}
                  hitSlop={4}
                  style={[
                    styles.toolBtn,
                    styles.acceptBtn,
                    decisionBusy ? {opacity: 0.55} : null,
                  ]}>
                  {deciding === 'accept' ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.status.success}
                    />
                  ) : (
                    <Check
                      size={18}
                      color={theme.status.success}
                      strokeWidth={2.6}
                    />
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('rejectOrder')}
                  disabled={decisionBusy}
                  onPress={onReject}
                  hitSlop={4}
                  style={[
                    styles.toolBtn,
                    styles.rejectBtn,
                    decisionBusy ? {opacity: 0.55} : null,
                  ]}>
                  {deciding === 'reject' ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.status.error}
                    />
                  ) : (
                    <X size={18} color={theme.status.error} strokeWidth={2.6} />
                  )}
                </Pressable>
              </>
            ) : null}
            {canCompletePickup ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('completePickup')}
                disabled={decisionBusy}
                onPress={onCompletePickup}
                hitSlop={4}
                style={[
                  styles.toolBtn,
                  styles.acceptBtn,
                  decisionBusy ? {opacity: 0.55} : null,
                ]}>
                {deciding === 'pickup' ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.status.success}
                  />
                ) : (
                  <Check
                    size={18}
                    color={theme.status.success}
                    strokeWidth={2.6}
                  />
                )}
              </Pressable>
            ) : null}
            {canAssignDriver ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('assignDriver')}
                disabled={decisionBusy}
                onPress={onAssignDriver}
                hitSlop={4}
                style={[
                  styles.assignChip,
                  {flexDirection: rowDir},
                  decisionBusy ? {opacity: 0.55} : null,
                ]}>
                {assigning ? (
                  <ActivityIndicator size="small" color={assignColor} />
                ) : (
                  <UserPlus color={assignColor} size={14} strokeWidth={2.4} />
                )}
                <AppText style={styles.assignChipText} numberOfLines={1}>
                  {t('assignDriver')}
                </AppText>
              </Pressable>
            ) : null}
            {showDriverName ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('viewDriverDetails')}
                onPress={onDriverDetails}
                disabled={!onDriverDetails}
                hitSlop={4}
                style={[
                  styles.driverChip,
                  {flexDirection: rowDir},
                  !onDriverDetails ? {opacity: 0.45} : null,
                ]}>
                <Truck color={assignColor} size={14} strokeWidth={2.4} />
                <AppText style={styles.assignChipText} numberOfLines={1}>
                  {driverName}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default CompanyOrderCard;
