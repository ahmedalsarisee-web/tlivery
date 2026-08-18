import {useMemo, type FC} from 'react';
import {Image, Linking, Pressable, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  Bike,
  Car,
  ChevronLeft,
  ChevronRight,
  Phone,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import CornerFlagBadge from '@app/components/corner-flag-badge';
import type {StatusChipTone} from '@app/components/status-chip';
import type {Driver, DriverStatus} from '@app/models/workflow.model';
import type {VehicleType} from '@app/features/company/types';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {driverCardStyles} from './styles';

type DriverCardProps = {
  driver: Driver;
  onPress: () => void;
};

export const driverStatusTone = (status: DriverStatus): StatusChipTone => {
  switch (status) {
    case 'active':
      return 'delivered';
    case 'busy':
      return 'onTheWay';
    case 'suspended':
      return 'cancelled';
    default:
      return 'waiting';
  }
};

export const driverInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'DR';

const statusDotColor = (
  status: DriverStatus,
  theme: ReturnType<typeof useTheme>['theme'],
) => {
  switch (status) {
    case 'active':
      return theme.status.success;
    case 'busy':
      return theme.status.warning;
    case 'suspended':
      return theme.status.error;
    default:
      return theme.typography.caption;
  }
};

const vehicleIcon = (type: VehicleType): LucideIcon => {
  switch (type) {
    case 'motorcycle':
      return Bike;
    case 'van':
      return Truck;
    default:
      return Car;
  }
};

const RatingStars: FC<{rating: number; color: string; emptyColor: string}> = ({
  rating,
  color,
  emptyColor,
}) => {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    const filled = rating >= i - 0.25;
    const half = !filled && rating >= i - 0.75;
    stars.push(
      <Star
        key={i}
        size={11}
        color={filled || half ? color : emptyColor}
        fill={filled ? color : 'transparent'}
        strokeWidth={2}
        style={half ? {opacity: 0.55} : undefined}
      />,
    );
  }
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 1}}>
      {stars}
    </View>
  );
};

const DriverCard: FC<DriverCardProps> = ({driver, onPress}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => driverCardStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const rtl = isRTL(direction);
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const VehicleIcon = vehicleIcon(driver.vehicleType);
  const accent = themeType === 'dark' ? theme.brand.gold : theme.brand.navy;
  const onAccent =
    themeType === 'dark' ? theme.brand.navy : theme.base.white;
  const isTopDriver =
    driver.badges.includes('featured') ||
    driver.badges.includes('gold') ||
    driver.rating >= 4.5;

  const vehicleTypeLabel = t(`vehicle_${driver.vehicleType}`);
  const plate = driver.plateNumber?.trim();

  const onCall = async () => {
    const phone = driver.phoneNumber?.replace(/\s+/g, '');
    if (!phone) {
      showToast(ToastType.info, t('phoneUnavailable'));
      return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      showToast(ToastType.error, t('phoneOpenFailed'));
    }
  };

  return (
    <Card style={styles.card}>
      {isTopDriver ? (
        <CornerFlagBadge
          label={t('topDriver')}
          backgroundColor={accent}
          color={onAccent}
          icon={
            <Star
              size={9}
              color={onAccent}
              fill={onAccent}
              strokeWidth={0}
            />
          }
        />
      ) : null}

      <View style={[styles.row, {flexDirection: getFlexDirection(direction)}]}>
        {/* Col 1 — avatar + status */}
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.colAvatar}>
          <View style={styles.avatar}>
            {driver.photoUrl ? (
              <Image
                source={{uri: driver.photoUrl}}
                style={styles.avatarImage}
              />
            ) : (
              <AppText style={styles.avatarText}>
                {driverInitials(driver.fullName)}
              </AppText>
            )}
          </View>
          <View
            style={[
              styles.statusDot,
              {backgroundColor: statusDotColor(driver.status, theme)},
            ]}
          />
        </Pressable>

        {/* Col 2 — name / rating / vehicle */}
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.colInfo}>
          <AppText style={styles.name} numberOfLines={1}>
            {driver.fullName}
          </AppText>

          <View
            style={[
              styles.ratingRow,
              {flexDirection: getFlexDirection(direction)},
            ]}>
            <View style={styles.ratingBadge}>
              <Star
                size={9}
                color={onAccent}
                fill={onAccent}
                strokeWidth={0}
              />
            </View>
            <AppText style={styles.ratingValue}>
              {driver.rating.toFixed(1)}
            </AppText>
            <RatingStars
              rating={driver.rating}
              color={theme.brand.gold}
              emptyColor={theme.ui.border}
            />
            <AppText style={styles.reviewCount}>
              {`(${driver.completedOrders})`}
            </AppText>
          </View>

          <View
            style={[
              styles.vehicleRow,
              {flexDirection: getFlexDirection(direction)},
            ]}>
            <View style={styles.vehicleIconBox}>
              <VehicleIcon
                size={12}
                color={theme.typography.secondary}
                strokeWidth={2.2}
              />
            </View>
            <AppText style={styles.vehicleText} numberOfLines={1}>
              {vehicleTypeLabel}
            </AppText>
            {plate ? (
              <>
                <View style={styles.vehicleSep} />
                <AppText style={styles.vehicleText} numberOfLines={1}>
                  {plate}
                </AppText>
              </>
            ) : null}
          </View>
        </Pressable>

        {/* Col 3 — divider + call + chevron */}
        <View style={styles.actionsDivider} />
        <View
          style={[
            styles.colActions,
            {flexDirection: getFlexDirection(direction)},
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('callDriver')}
            hitSlop={6}
            onPress={() => {
              void onCall();
            }}
            style={styles.callBtn}>
            <Phone size={16} color={onAccent} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            hitSlop={8}
            style={styles.chevronBtn}>
            <Chevron size={18} color={accent} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
};

export default DriverCard;
