import {useEffect, useMemo, useState, type FC} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  Calendar,
  Camera,
  CheckCircle2,
  FileText,
  IdCard,
  Phone,
  Shield,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import type {RootStackParamList} from '@app/types/navigation';
import type {DriverStatus} from '@app/models/workflow.model';
import type {VehicleType} from '@app/features/company/types';
import {
  useCompanyDriver,
  useRemoveCompanyDriver,
  useUpdateCompanyDriver,
} from '@app/hooks/useWorkflow';
import {driverInitials, driverStatusTone} from '@app/components/driver-card';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import Card from '@app/components/card';
import Column from '@app/components/column';
import Row from '@app/components/row';
import CenterModal from '@app/components/center-modal';
import FormField from '@app/components/form-field';
import FilterChips from '@app/components/filter-chips';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {statusSoftFor, space} from '@app/theme/tokens';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {openWhatsAppInvite} from '@app/utils/whatsappInvite';
import {
  pickCompressedDriverImage,
  type DriverImageKind,
} from '@app/utils/compressImage';
import {uploadDriverImage} from '@app/services/DriverMediaService';
import {driverDetailsStyles} from './DriverDetails.styles';

type Route = NativeStackScreenProps<RootStackParamList, 'DriverDetails'>['route'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'DriverDetails'>;
type DetailsTab = 'overview' | 'performance' | 'documents' | 'activity';

const VEHICLE_OPTIONS: VehicleType[] = ['motorcycle', 'car', 'van'];
const STATUS_OPTIONS: DriverStatus[] = [
  'active',
  'busy',
  'offline',
  'suspended',
];

const DriverDetailsScreen: FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const driverQuery = useCompanyDriver(route.params.driverId);
  const updateDriver = useUpdateCompanyDriver();
  const removeDriver = useRemoveCompanyDriver();
  const driver = driverQuery.data;
  const styles = useMemo(
    () => driverDetailsStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const iconColor =
    themeType === 'dark' ? theme.brand.gold : theme.brand.navy;

  const [tab, setTab] = useState<DetailsTab>('overview');
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<DriverImageKind | null>(
    null,
  );
  const [mediaPickerKind, setMediaPickerKind] =
    useState<DriverImageKind | null>(null);
  const [fullName, setFullName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [insuranceValidUntil, setInsuranceValidUntil] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [status, setStatus] = useState<DriverStatus>('active');

  useEffect(() => {
    if (!driver) {
      return;
    }
    setFullName(driver.fullName);
    setPlateNumber(driver.plateNumber);
    setLicenseNumber(driver.licenseNumber);
    setVehicleModel(driver.vehicleModel ?? '');
    setVehicleColor(driver.vehicleColor ?? '');
    setModelYear(driver.modelYear ? String(driver.modelYear) : '');
    setInsuranceValidUntil(driver.insuranceValidUntil ?? '');
    setVehicleType(driver.vehicleType);
    setStatus(driver.status);
  }, [driver]);

  const vehicleOptions = useMemo(
    () =>
      VEHICLE_OPTIONS.map(value => ({
        value,
        label: t(`vehicle_${value}`),
      })),
    [t],
  );

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map(value => ({
        value,
        label: t(`driverStatus_${value}`),
      })),
    [t],
  );

  const tabs = useMemo(
    () =>
      [
        {key: 'overview' as const, label: t('driverTabOverview')},
        {key: 'performance' as const, label: t('driverTabPerformance')},
        {key: 'documents' as const, label: t('driverTabDocuments')},
        {key: 'activity' as const, label: t('driverTabActivity')},
      ] as const,
    [t],
  );

  const onSave = () => {
    if (!driver) {
      return;
    }
    const name = fullName.trim();
    const plate = plateNumber.trim();
    const license = licenseNumber.trim();
    if (!name || !plate || !license) {
      showToast(ToastType.error, t('driverFormRequired'));
      return;
    }
    const yearTrim = modelYear.trim();
    let parsedYear: number | null = null;
    if (yearTrim) {
      parsedYear = Number(yearTrim);
      if (!Number.isFinite(parsedYear) || parsedYear < 1980 || parsedYear > 2100) {
        showToast(ToastType.error, t('vehicleModelYearInvalid'));
        return;
      }
    }
    const insurance = insuranceValidUntil.trim();
    if (insurance && !/^\d{4}-\d{2}-\d{2}$/.test(insurance)) {
      showToast(ToastType.error, t('vehicleInsuranceDateInvalid'));
      return;
    }
    updateDriver.mutate(
      {
        driverId: driver.id,
        fullName: name,
        plateNumber: plate,
        licenseNumber: license,
        vehicleType,
        vehicleModel: vehicleModel.trim(),
        vehicleColor: vehicleColor.trim(),
        modelYear: parsedYear,
        insuranceValidUntil: insurance || null,
        status,
      },
      {
        onSuccess: () => {
          showToast(ToastType.success, t('driverUpdated'));
          setEditing(false);
        },
        onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
      },
    );
  };

  const onCall = async () => {
    const phone = driver?.phoneNumber?.replace(/\s+/g, '');
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

  const onMessage = async () => {
    const phone = driver?.phoneNumber?.replace(/\s+/g, '');
    if (!phone) {
      showToast(ToastType.info, t('phoneUnavailable'));
      return;
    }
    try {
      await openWhatsAppInvite({
        phoneE164: phone,
        message: t('messageDriver'),
      });
    } catch {
      try {
        await Linking.openURL(`sms:${phone}`);
      } catch {
        showToast(ToastType.error, t('messageOpenFailed'));
      }
    }
  };

  const onConfirmRemove = () => {
    if (!driver) {
      return;
    }
    removeDriver.mutate(driver.id, {
      onSuccess: () => {
        setConfirmRemove(false);
        showToast(ToastType.success, t('driverRemoved'));
        navigation.goBack();
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const urlFieldForKind = (
    kind: DriverImageKind,
  ):
    | 'photoUrl'
    | 'licenseImageUrl'
    | 'registrationImageUrl'
    | 'insuranceImageUrl' => {
    switch (kind) {
      case 'avatar':
        return 'photoUrl';
      case 'license':
        return 'licenseImageUrl';
      case 'registration':
        return 'registrationImageUrl';
      case 'insurance':
        return 'insuranceImageUrl';
    }
  };

  const runMediaUpload = async (
    kind: DriverImageKind,
    source: 'library' | 'camera',
  ) => {
    if (!driver) {
      return;
    }
    try {
      const picked = await pickCompressedDriverImage(kind, source);
      if (!picked) {
        return;
      }
      setUploadingKind(kind);
      const url = await uploadDriverImage({
        companyId: driver.companyId,
        driverId: driver.id,
        kind,
        localUri: picked.uri,
        contentType: picked.type,
      });
      await updateDriver.mutateAsync({
        driverId: driver.id,
        [urlFieldForKind(kind)]: url,
      });
      showToast(
        ToastType.success,
        kind === 'avatar' ? t('photoUpdated') : t('documentImageUpdated'),
      );
    } catch {
      showToast(ToastType.error, t('photoUploadFailed'));
    } finally {
      setUploadingKind(null);
    }
  };

  const promptMediaUpload = (kind: DriverImageKind) => {
    setMediaPickerKind(kind);
  };

  const onPickMediaSource = (source: 'library' | 'camera') => {
    const kind = mediaPickerKind;
    setMediaPickerKind(null);
    if (!kind) {
      return;
    }
    void runMediaUpload(kind, source);
  };

  if (!driver && !driverQuery.isLoading) {
    return (
      <ScreenContainer navTitle={t('driverDetails')}>
        <AppText variant="body">{t('driverNotFound')}</AppText>
      </ScreenContainer>
    );
  }

  if (!driver) {
    return <ScreenContainer navTitle={t('driverDetails')} loading />;
  }

  const tone = driverStatusTone(driver.status);
  const soft = statusSoftFor(themeType)[tone];
  const vehicleLabel =
    driver.vehicleModel?.trim() || t(`vehicle_${driver.vehicleType}`);
  const joinLabel =
    driver.createdAt.getTime() > 0
      ? driver.createdAt.toLocaleDateString()
      : t('notSet');

  const infoRows: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
    plate?: string;
  }> = [
    {
      icon: Truck,
      label: t('driverVehicle'),
      value: vehicleLabel,
      plate: driver.plateNumber || undefined,
    },
    {
      icon: IdCard,
      label: t('driverLicense'),
      value: driver.licenseNumber || t('notSet'),
    },
    {
      icon: Shield,
      label: t('licenseExpiry'),
      value: driver.insuranceValidUntil || t('notSet'),
    },
    {
      icon: Calendar,
      label: t('joinDate'),
      value: joinLabel,
    },
  ];

  const summaryTiles = [
    {
      label: t('statCompleted'),
      value: String(driver.completedOrders),
      bg: themeType === 'dark' ? 'rgba(112,184,255,0.16)' : '#DBEAFE',
      fg: themeType === 'dark' ? theme.status.info : '#1E3A8A',
      Icon: CheckCircle2,
    },
    {
      label: t('statInProgress'),
      value: String(driver.activeOrders),
      bg: themeType === 'dark' ? 'rgba(255,196,83,0.16)' : '#FFEDD5',
      fg: themeType === 'dark' ? theme.status.warning : '#9A3412',
      Icon: Truck,
    },
    {
      label: t('statSuccessRate'),
      value: `${Math.round(driver.successRate)}%`,
      bg: themeType === 'dark' ? 'rgba(61,214,140,0.16)' : '#D1FAE5',
      fg: themeType === 'dark' ? theme.status.success : '#065F46',
      Icon: Shield,
    },
    {
      label: t('statRating'),
      value: driver.rating.toFixed(1),
      bg: themeType === 'dark' ? 'rgba(212,175,55,0.16)' : '#FEF3C7',
      fg: theme.brand.gold,
      Icon: Star,
    },
  ];

  const perfStrip = [
    {label: t('statRating'), value: driver.rating.toFixed(1)},
    {
      label: t('statSuccessRate'),
      value: `${Math.round(driver.successRate)}%`,
    },
    {label: t('statCompleted'), value: String(driver.completedOrders)},
    {label: t('statInProgress'), value: String(driver.activeOrders)},
  ];

  const docs: Array<{
    title: string;
    sub: string;
    verified: boolean;
    imageUrl: string | null;
    kind: Exclude<DriverImageKind, 'avatar'>;
    Icon: LucideIcon;
  }> = [
    {
      title: t('driverLicenseDoc'),
      sub: driver.licenseNumber || t('notSet'),
      verified: Boolean(driver.licenseImageUrl || driver.licenseNumber?.trim()),
      imageUrl: driver.licenseImageUrl,
      kind: 'license',
      Icon: IdCard,
    },
    {
      title: t('vehicleRegistration'),
      sub: driver.plateNumber || t('notSet'),
      verified: Boolean(
        driver.registrationImageUrl || driver.plateNumber?.trim(),
      ),
      imageUrl: driver.registrationImageUrl,
      kind: 'registration',
      Icon: FileText,
    },
    {
      title: t('vehicleInsuranceDoc'),
      sub: driver.insuranceValidUntil || t('notSet'),
      verified: Boolean(
        driver.insuranceImageUrl || driver.insuranceValidUntil,
      ),
      imageUrl: driver.insuranceImageUrl,
      kind: 'insurance',
      Icon: Shield,
    },
  ];

  const activityItems = [
    {
      text: t('activityJoined'),
      date: joinLabel,
    },
    driver.completedOrders > 0
      ? {
          text: t('activityCompletedOrders', {count: driver.completedOrders}),
          date: '',
        }
      : null,
    driver.cancelledOrders > 0
      ? {
          text: t('activityCancelledOrders', {count: driver.cancelledOrders}),
          date: '',
        }
      : null,
    ...driver.badges.map(badge => ({
      text: t(`driverBadge_${badge}`, {defaultValue: badge}),
      date: '',
    })),
  ].filter(Boolean) as Array<{text: string; date: string}>;

  const renderInfoRows = () => (
    <View style={styles.infoCard}>
      {infoRows.map((row, index) => {
        const Icon = row.icon;
        return (
          <View
            key={row.label}
            style={[
              styles.infoRow,
              {flexDirection: getFlexDirection(direction)},
              index === infoRows.length - 1 && styles.infoRowLast,
            ]}>
            <View
              style={[
                styles.infoLabelWrap,
                {flexDirection: getFlexDirection(direction)},
              ]}>
              <View style={styles.infoIcon}>
                <Icon size={14} color={iconColor} strokeWidth={2.2} />
              </View>
              <AppText style={styles.infoLabel}>{row.label}</AppText>
            </View>
            <View
              style={[
                styles.infoValueWrap,
                {flexDirection: getFlexDirection(direction)},
              ]}>
              <AppText style={styles.infoValue} numberOfLines={2}>
                {row.value}
              </AppText>
              {row.plate ? (
                <View style={styles.platePill}>
                  <AppText style={styles.platePillText}>{row.plate}</AppText>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderSectionHeader = (
    title: string,
    linkLabel: string,
    onPress: () => void,
  ) => (
    <View
      style={[
        styles.sectionHeader,
        {flexDirection: getFlexDirection(direction)},
      ]}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText style={styles.sectionLink}>{linkLabel}</AppText>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer
      keyboardAvoiding
      navTitle={t('driverDetails')}
      padded
      pullToRefresh={{
        onRefresh: async () => {
          await driverQuery.refetch();
        },
      }}
      contentContainerStyle={{paddingBottom: space.md}}>
      <View style={styles.heroBlock}>
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroTop,
              {flexDirection: getFlexDirection(direction)},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                driver.photoUrl ? t('changePhoto') : t('uploadPhoto')
              }
              onPress={() => promptMediaUpload('avatar')}
              disabled={uploadingKind === 'avatar'}
              style={styles.avatarWrap}>
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
              <View style={styles.avatarCamBadge}>
                {uploadingKind === 'avatar' ? (
                  <ActivityIndicator size="small" color={theme.base.white} />
                ) : (
                  <Camera size={12} color={theme.base.white} strokeWidth={2.4} />
                )}
              </View>
            </Pressable>
            <View style={styles.heroMeta}>
              <View
                style={[
                  styles.nameRow,
                  {flexDirection: getFlexDirection(direction)},
                ]}>
                <AppText style={styles.heroName} numberOfLines={1}>
                  {driver.fullName}
                </AppText>
                <View style={[styles.statusPill, {backgroundColor: soft.bg}]}>
                  <AppText style={[styles.statusPillText, {color: soft.fg}]}>
                    {t(`driverStatus_${driver.status}`)}
                  </AppText>
                </View>
              </View>
              <View
                style={[
                  styles.ratingRow,
                  {flexDirection: getFlexDirection(direction)},
                ]}>
                <Star
                  size={12}
                  color={theme.brand.gold}
                  fill={theme.brand.gold}
                  strokeWidth={2}
                />
                <AppText style={styles.ratingText}>
                  {t('ratingWithOrders', {
                    rating: driver.rating.toFixed(1),
                    count: driver.completedOrders,
                  })}
                </AppText>
              </View>
              <View
                style={[
                  styles.contactRow,
                  {flexDirection: getFlexDirection(direction)},
                ]}>
                <Phone size={14} color={iconColor} strokeWidth={2.2} />
                <AppText style={styles.contactText} numberOfLines={1}>
                  {driver.phoneNumber || t('notSet')}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={[
            styles.tabs,
            {flexDirection: getFlexDirection(direction)},
          ]}>
          {tabs.map(item => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                onPress={() => {
                  setTab(item.key);
                  if (item.key !== 'documents') {
                    setEditing(false);
                  }
                }}
                style={[styles.tab, active && styles.tabActive]}>
                <AppText
                  style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {tab === 'overview' ? (
        <Column gap={space.md}>
          {renderInfoRows()}
          <View>
            {renderSectionHeader(t('todaysSummary'), t('viewAll'), () =>
              setTab('activity'),
            )}
            <View
              style={[
                styles.summaryCard,
                {flexDirection: getFlexDirection(direction)},
              ]}>
              {summaryTiles.map((tile, index) => {
                const Icon = tile.Icon;
                return (
                  <View
                    key={tile.label}
                    style={[
                      styles.summaryCell,
                      index > 0 && styles.summaryCellBorder,
                    ]}>
                    <View
                      style={[
                        styles.summaryIcon,
                        {backgroundColor: tile.bg},
                      ]}>
                      <Icon size={14} color={tile.fg} strokeWidth={2.2} />
                    </View>
                    <AppText style={styles.summaryValue}>{tile.value}</AppText>
                    <AppText style={styles.summaryLabel} numberOfLines={1}>
                      {tile.label}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
          <View>
            {renderSectionHeader(
              t('driverTabPerformance'),
              t('viewDetailsArrow'),
              () => setTab('performance'),
            )}
            <View
              style={[
                styles.perfStrip,
                {flexDirection: getFlexDirection(direction)},
              ]}>
              {perfStrip.map(cell => (
                <View key={cell.label} style={styles.perfCell}>
                  <AppText style={styles.perfValue}>{cell.value}</AppText>
                  <AppText style={styles.perfLabel} numberOfLines={1}>
                    {cell.label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
          {activityItems.length > 0 ? (
            <View>
              {renderSectionHeader(t('recentActivity'), t('viewAll'), () =>
                setTab('activity'),
              )}
              <View style={styles.infoCard}>
                {activityItems.slice(0, 3).map((item, index) => (
                  <View
                    key={`${item.text}-${index}`}
                    style={[
                      styles.activityItem,
                      {flexDirection: getFlexDirection(direction)},
                      index === Math.min(activityItems.length, 3) - 1 &&
                        styles.infoRowLast,
                    ]}>
                    <View style={styles.activityDot} />
                    <View style={{flex: 1}}>
                      <AppText style={styles.activityText}>{item.text}</AppText>
                      {item.date ? (
                        <AppText style={styles.activityDate}>
                          {item.date}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Column>
      ) : null}

      {tab === 'performance' ? (
        <Column gap={space.md}>
          <View style={styles.infoCard}>
            {(
              [
                [t('driverRating'), driver.rating.toFixed(1)],
                [t('driverCompletedOrders'), String(driver.completedOrders)],
                [t('driverCancelledOrders'), String(driver.cancelledOrders)],
                [
                  t('driverSuccessRate'),
                  `${Math.round(driver.successRate)}%`,
                ],
                [
                  t('driverActiveOrders', {count: driver.activeOrders}),
                  String(driver.activeOrders),
                ],
              ] as Array<[string, string]>
            ).map(([label, value]) => (
              <View
                key={label}
                style={[
                  styles.metricRow,
                  {flexDirection: getFlexDirection(direction)},
                ]}>
                <AppText style={styles.metricLabel}>{label}</AppText>
                <AppText style={styles.metricValue}>{value}</AppText>
              </View>
            ))}
          </View>
          {driver.badges.length > 0 ? (
            <View
              style={[
                styles.heroBadges,
                {flexDirection: getFlexDirection(direction)},
              ]}>
              {driver.badges.map(badge => (
                <View key={badge} style={styles.badgeChip}>
                  <AppText style={styles.badgeChipText}>
                    {t(`driverBadge_${badge}`, {defaultValue: badge})}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </Column>
      ) : null}

      {tab === 'documents' ? (
        <Column gap={space.md}>
          {editing ? (
            <Card>
              <Column gap={space.sm}>
                <AppText style={styles.sectionTitle}>
                  {t('driverProfile')}
                </AppText>
                <AppTextInput
                  label={t('driverFullName')}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t('driverFullNamePlaceholder')}
                />
                <Column gap={space.xxs}>
                  <AppText variant="caption">{t('driverPhone')}</AppText>
                  <AppText variant="body">{driver.phoneNumber}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {t('driverPhoneReadOnlyHint')}
                  </AppText>
                </Column>
                <FormField label={t('signupVehicleType')}>
                  <FilterChips
                    options={vehicleOptions}
                    value={vehicleType}
                    onChange={value => setVehicleType(value as VehicleType)}
                  />
                </FormField>
                <AppTextInput
                  label={t('vehicleModelLabel')}
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  placeholder={t('vehicleModelPlaceholder')}
                />
                <AppTextInput
                  label={t('vehicleColorLabel')}
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  placeholder={t('vehicleColorPlaceholder')}
                />
                <AppTextInput
                  label={t('vehicleModelYearLabel')}
                  value={modelYear}
                  onChangeText={setModelYear}
                  placeholder="2020"
                  keyboardType="number-pad"
                />
                <AppTextInput
                  label={t('driverPlate')}
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                  placeholder={t('driverPlatePlaceholder')}
                  autoCapitalize="characters"
                />
                <AppTextInput
                  label={t('driverLicense')}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  placeholder={t('driverLicensePlaceholder')}
                  autoCapitalize="characters"
                />
                <AppTextInput
                  label={t('vehicleInsuranceExpiryLabel')}
                  value={insuranceValidUntil}
                  onChangeText={setInsuranceValidUntil}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                />
                <FormField label={t('driverStatus')}>
                  <FilterChips
                    options={statusOptions}
                    value={status}
                    onChange={value => setStatus(value as DriverStatus)}
                  />
                </FormField>
                <AppButton
                  title={t('saveDriver')}
                  loading={updateDriver.isPending}
                  onPress={onSave}
                />
                <AppButton
                  title={t('cancelEditDriver')}
                  variant="secondary"
                  onPress={() => setEditing(false)}
                />
              </Column>
            </Card>
          ) : (
            <>
              <Column gap={space.sm}>
                {docs.map(doc => {
                  const Icon = doc.Icon;
                  const uploading = uploadingKind === doc.kind;
                  return (
                    <View key={doc.title} style={styles.docCardCol}>
                      <View
                        style={[
                          styles.docCard,
                          {flexDirection: getFlexDirection(direction)},
                        ]}>
                        {doc.imageUrl ? (
                          <Image
                            source={{uri: doc.imageUrl}}
                            style={styles.docThumb}
                          />
                        ) : (
                          <View style={styles.docIcon}>
                            <Icon
                              size={18}
                              color={iconColor}
                              strokeWidth={2.2}
                            />
                          </View>
                        )}
                        <View style={styles.docBody}>
                          <AppText style={styles.docTitle}>{doc.title}</AppText>
                          <AppText style={styles.docSub} numberOfLines={1}>
                            {doc.sub}
                          </AppText>
                        </View>
                        <View
                          style={
                            doc.verified
                              ? styles.verifiedPill
                              : styles.missingPill
                          }>
                          <AppText
                            style={
                              doc.verified
                                ? styles.verifiedText
                                : styles.missingText
                            }>
                            {doc.verified
                              ? t('documentVerified')
                              : t('documentMissing')}
                          </AppText>
                        </View>
                      </View>
                      <AppButton
                        title={
                          doc.imageUrl
                            ? t('changeDocumentImage')
                            : t('uploadDocumentImage')
                        }
                        variant="secondary"
                        loading={uploading}
                        onPress={() => promptMediaUpload(doc.kind)}
                      />
                    </View>
                  );
                })}
              </Column>

              <View>
                <AppText style={styles.sectionTitle}>
                  {t('vehicleInformation')}
                </AppText>
                <View style={styles.infoCard}>
                  {(
                    [
                      [t('makeAndModel'), vehicleLabel],
                      [
                        t('vehicleYear'),
                        driver.modelYear ? String(driver.modelYear) : t('notSet'),
                      ],
                      [
                        t('vehicleColor'),
                        driver.vehicleColor?.trim() || t('notSet'),
                      ],
                      [t('plateNumber'), driver.plateNumber || t('notSet')],
                    ] as Array<[string, string]>
                  ).map(([label, value], index, arr) => (
                    <View
                      key={label}
                      style={[
                        styles.infoRow,
                        {flexDirection: getFlexDirection(direction)},
                        index === arr.length - 1 && styles.infoRowLast,
                      ]}>
                      <AppText style={styles.infoLabel}>{label}</AppText>
                      <AppText style={styles.infoValue}>{value}</AppText>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <AppText style={styles.sectionTitle}>
                  {t('emergencyContact')}
                </AppText>
                <View style={styles.infoCard}>
                  <View
                    style={[
                      styles.infoRow,
                      styles.infoRowLast,
                      {flexDirection: getFlexDirection(direction)},
                    ]}>
                    <AppText style={styles.infoLabel}>{t('notSet')}</AppText>
                  </View>
                </View>
              </View>

              <AppButton
                title={t('editDriver')}
                variant="secondary"
                onPress={() => setEditing(true)}
              />
              <AppButton
                title={t('removeDriver')}
                variant="destructive"
                onPress={() => setConfirmRemove(true)}
              />
            </>
          )}
        </Column>
      ) : null}

      {tab === 'activity' ? (
        <View style={styles.infoCard}>
          {activityItems.length === 0 ? (
            <AppText style={styles.docSub}>{t('notSet')}</AppText>
          ) : (
            activityItems.map((item, index) => (
              <View
                key={`${item.text}-${index}`}
                style={[
                  styles.activityItem,
                  {flexDirection: getFlexDirection(direction)},
                  index === activityItems.length - 1 && styles.infoRowLast,
                ]}>
                <View style={styles.activityDot} />
                <View style={{flex: 1}}>
                  <AppText style={styles.activityText}>{item.text}</AppText>
                  {item.date ? (
                    <AppText style={styles.activityDate}>{item.date}</AppText>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}

      <View
        style={[
          styles.bottomBar,
          {flexDirection: getFlexDirection(direction)},
        ]}>
        <View style={styles.bottomBtn}>
          <AppButton
            title={t('messageDriver')}
            variant="secondary"
            onPress={() => {
              void onMessage();
            }}
          />
        </View>
        <View style={styles.bottomBtn}>
          <AppButton
            title={t('callDriver')}
            onPress={() => {
              void onCall();
            }}
          />
        </View>
      </View>

      <CenterModal
        visible={mediaPickerKind != null}
        onClose={() => setMediaPickerKind(null)}
        title={t(
          mediaPickerKind === 'avatar' ? 'uploadPhoto' : 'uploadDocumentImage',
        )}>
        <Column gap={space.sm}>
          <AppButton
            title={t('pickFromLibrary')}
            variant="secondary"
            onPress={() => onPickMediaSource('library')}
          />
          <AppButton
            title={t('takePhoto')}
            onPress={() => onPickMediaSource('camera')}
          />
          <AppButton
            title={t('cancel')}
            variant="secondary"
            onPress={() => setMediaPickerKind(null)}
          />
        </Column>
      </CenterModal>

      <CenterModal
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={t('deleteDriverTitle')}>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {t('deleteDriverBody', {name: driver.fullName})}
          </AppText>
          <Row gap={space.sm}>
            <View style={styles.bottomBtn}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setConfirmRemove(false)}
              />
            </View>
            <View style={styles.bottomBtn}>
              <AppButton
                title={t('removeDriver')}
                variant="destructive"
                loading={removeDriver.isPending}
                onPress={onConfirmRemove}
              />
            </View>
          </Row>
        </Column>
      </CenterModal>
    </ScreenContainer>
  );
};

export default DriverDetailsScreen;
