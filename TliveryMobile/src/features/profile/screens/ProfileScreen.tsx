import {useEffect, useMemo, useState, type FC, type ReactNode} from 'react';
import {Image, Pressable, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Headphones,
  Languages,
  LogOut,
  Moon,
  Star,
  Truck,
  Wallet,
} from 'lucide-react-native';
import {
  useTheme,
  type ThemePreference,
} from '@app/providers/ThemeContext';
import {useLanguage, type LangPreference} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import {
  selectCanManageCustomers,
  selectCanViewMerchants,
  selectIsCompanyAdmin,
  selectProfileComplete,
  selectProfileReady,
  selectUserId,
  selectUserName,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import {useLogout} from '@app/hooks/useAuth';
import {useCompany, useMyDriverProfile} from '@app/hooks/useWorkflow';
import type {RootStackParamList} from '@app/types/navigation';
import {isRTL} from '@app/utils/directionalStyles';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import ScreenContainer from '@app/components/screen-container';
import CenterModal from '@app/components/center-modal';
import AppButton from '@app/components/app-button';
import Card from '@app/components/card';
import Column from '@app/components/column';
import Row from '@app/components/row';
import AppText from '@app/components/app-text';
import brand from '@app/config/brand';
import {profileStyles} from '../Profile.styles';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
const LANGUAGE_OPTIONS: LangPreference[] = ['system', 'en', 'ar'];
const LANGUAGE_FLAGS: Record<LangPreference, string> = {
  system: '🌐',
  en: '🇪🇺',
  ar: '🇸🇦',
};

const CAPTAIN_AVATAR = require('@app/assets/images/wasel/tracking/fleet-captain-marker.png');

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  subtitle?: string;
  danger?: boolean;
  onPress?: () => void;
};

const ProfileScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const logout = useLogout();
  const {theme, themePreference, setTheme, themeType} = useTheme();
  const {direction, languagePreference, changeLanguage} = useLanguage();
  const {country} = useCountry();
  const styles = useMemo(
    () => profileStyles(theme, direction),
    [theme, direction],
  );

  const userId = useUserStore(selectUserId);
  const userName = useUserStore(selectUserName);
  const role = useUserStore(selectUserRole);
  const profileReady = useUserStore(selectProfileReady);
  const profileComplete = useUserStore(selectProfileComplete);
  const isCompanyAdmin = useUserStore(selectIsCompanyAdmin);
  const canViewMerchants = useUserStore(selectCanViewMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const isCompanyStaff =
    role === 'company_admin' || role === 'company_employee';
  const isDriver = role === 'driver';
  const isIssuedAccount = role === 'client' || role === 'merchant';

  useEffect(() => {
    if (!profileReady || !isIssuedAccount || profileComplete) {
      return;
    }
    navigation.replace('CompleteClientProfile');
  }, [isIssuedAccount, navigation, profileComplete, profileReady]);

  const companyId = useUserStore(state => state.companyId);
  const company = useCompany(companyId).data;
  const driverQuery = useMyDriverProfile(isDriver ? userId : null);
  const driver = driverQuery.data;

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const rtl = isRTL(direction);
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;
  const iconColor = themeType === 'dark' ? theme.brand.gold : '#0F172A';
  const checkColor =
    themeType === 'dark' ? theme.brand.gold : theme.brand.navy;

  const displayName =
    driver?.fullName?.trim() || userName?.trim() || t('settingsProfileName');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

  const vehicleSubtitle = useMemo(() => {
    if (!driver) {
      return t('myVehicleEmpty');
    }
    const typeLabel = t(`vehicle_${driver.vehicleType}`);
    const model = driver.vehicleModel?.trim();
    const plate = driver.plateNumber?.trim();
    const lead = model || typeLabel;
    return plate ? `${lead} · ${plate}` : lead;
  }, [driver, t]);

  const themeLabel = useMemo(() => {
    if (themePreference === 'light') {
      return t('light');
    }
    if (themePreference === 'dark') {
      return t('dark');
    }
    return t('system');
  }, [t, themePreference]);

  const languageLabel = useMemo(() => {
    if (languagePreference === 'en') {
      return t('english');
    }
    if (languagePreference === 'ar') {
      return t('arabic');
    }
    return t('system');
  }, [languagePreference, t]);

  const onConfirmSignOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setSignOutModalVisible(false);
        navigation.replace('Login');
      },
    });
  };

  const primaryMenu: MenuItem[] = [];
  if (isDriver) {
    primaryMenu.push({
      key: 'vehicle',
      icon: <Truck size={18} color={iconColor} strokeWidth={2} />,
      label: t('myVehicle'),
      subtitle: vehicleSubtitle,
      onPress: () => navigation.navigate('MyVehicle'),
    });
    primaryMenu.push({
      key: 'documents',
      icon: <FileText size={18} color={iconColor} strokeWidth={2} />,
      label: t('profileDocuments'),
      subtitle: t('profileDocumentsSubtitle'),
      onPress: () => navigation.navigate('MyDocuments'),
    });
  }

  if (isCompanyStaff) {
    primaryMenu.push({
      key: 'accounts',
      icon: <Wallet size={18} color={iconColor} strokeWidth={2} />,
      label: t('navAccounts'),
      onPress: () => navigation.navigate('AccountsHub'),
    });
    if (canViewMerchants || canManageCustomers) {
      primaryMenu.push({
        key: 'issued',
        icon: <Building2 size={18} color={iconColor} strokeWidth={2} />,
        label: t('navIssuedAccounts'),
        onPress: () => navigation.navigate('MerchantsTab'),
      });
    }
    primaryMenu.push({
      key: 'reports',
      icon: <BarChart3 size={18} color={iconColor} strokeWidth={2} />,
      label: t('navReports'),
      onPress: () => navigation.navigate('Reports'),
    });
  }

  if (isIssuedAccount) {
    primaryMenu.push({
      key: 'accounts',
      icon: <Wallet size={18} color={iconColor} strokeWidth={2} />,
      label: t('navAccounts'),
      onPress: () => navigation.navigate('AccountsHub'),
    });
  }

  primaryMenu.push({
    key: 'notifications',
    icon: <Bell size={18} color={iconColor} strokeWidth={2} />,
    label: t('settingsNotifications'),
    onPress: () => navigation.navigate('Notifications'),
  });

  if (isCompanyAdmin || isIssuedAccount) {
    primaryMenu.push({
      key: 'company',
      icon: <Building2 size={18} color={iconColor} strokeWidth={2} />,
      label: isCompanyAdmin
        ? t('settingsCompanyProfile')
        : t('settingsCompanies'),
      subtitle: isCompanyAdmin ? company?.code : company?.name,
      onPress: () =>
        navigation.navigate(isCompanyAdmin ? 'CompanyDetails' : 'Orders'),
    });
  }

  primaryMenu.push({
    key: 'support',
    icon: <Headphones size={18} color={iconColor} strokeWidth={2} />,
    label: t('profileHelpSupport'),
    onPress: () => showToast(ToastType.info, t('featureComingSoon')),
  });

  const settingsMenu: MenuItem[] = [
    {
      key: 'theme',
      icon: <Moon size={18} color={iconColor} strokeWidth={2} />,
      label: t('theme'),
      subtitle: themeLabel,
      onPress: () => setThemeModalVisible(true),
    },
    {
      key: 'language',
      icon: <Languages size={18} color={iconColor} strokeWidth={2} />,
      label: t('language'),
      subtitle: languageLabel,
      onPress: () => setLanguageModalVisible(true),
    },
    {
      key: 'country',
      icon: <Globe size={18} color={iconColor} strokeWidth={2} />,
      label: t('country'),
      subtitle: `${country.flag} ${t(country.nameKey)}`,
      onPress: () => navigation.navigate('SelectCountry', {mode: 'change'}),
    },
  ];

  const renderMenu = (items: MenuItem[], dangerLast?: boolean) => (
    <Card style={styles.menuCard}>
      {items.map((item, index) => (
        <View key={item.key}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            onPress={item.onPress}
            disabled={!item.onPress}
            style={({pressed}) => [
              styles.menuRow,
              pressed && item.onPress ? styles.menuRowPressed : null,
            ]}>
            <View style={styles.menuLeft}>
              <View
                style={[
                  styles.menuIcon,
                  item.danger ? styles.menuIconDanger : null,
                ]}>
                {item.icon}
              </View>
              <View style={styles.menuText}>
                <AppText
                  variant="label"
                  style={[
                    styles.menuLabel,
                    item.danger ? styles.menuLabelDanger : null,
                  ]}>
                  {item.label}
                </AppText>
                {item.subtitle ? (
                  <AppText variant="caption" style={styles.menuSubtitle}>
                    {item.subtitle}
                  </AppText>
                ) : null}
              </View>
            </View>
            {item.onPress && !dangerLast ? (
              <ChevronIcon
                size={18}
                color={theme.typography.caption}
                strokeWidth={2.2}
              />
            ) : null}
          </Pressable>
        </View>
      ))}
    </Card>
  );

  return (
    <ScreenContainer
      navTitle={t('tabProfile')}
      loading={isDriver && driverQuery.isLoading}
      pullToRefresh={{
        onRefresh: async () => {
          if (isDriver) {
            await driverQuery.refetch();
          }
        },
      }}>
      {isIssuedAccount ? (
        <AppText variant="caption" tone="secondary">
          {t('issuedAccountMoreHint')}
        </AppText>
      ) : null}

      <Card>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              {isDriver ? (
                <Image
                  source={
                    driver?.photoUrl
                      ? {uri: driver.photoUrl}
                      : CAPTAIN_AVATAR
                  }
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <AppText variant="heading" style={styles.avatarInitials}>
                  {initials || 'WA'}
                </AppText>
              )}
            </View>
            <View style={styles.headerText}>
              <AppText variant="heading" style={styles.name}>
                {displayName}
              </AppText>
              {isDriver && typeof driver?.rating === 'number' ? (
                <View style={styles.ratingRow}>
                  <Star
                    size={14}
                    color={theme.brand.gold}
                    fill={theme.brand.gold}
                    strokeWidth={0}
                  />
                  <AppText variant="caption" style={styles.ratingText}>
                    {driver.rating > 0 ? driver.rating.toFixed(1) : '—'}
                  </AppText>
                </View>
              ) : (
                <AppText variant="caption" tone="secondary">
                  {isCompanyAdmin || isIssuedAccount
                    ? company?.name ?? brand.name
                    : brand.name}
                </AppText>
              )}
              <Pressable
                style={styles.viewProfile}
                onPress={() => navigation.navigate('AccountInfo')}
                hitSlop={6}>
                <AppText variant="caption" style={styles.viewProfileText}>
                  {t('viewProfile')}
                </AppText>
                <ChevronIcon
                  size={14}
                  color={theme.typography.secondary}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Card>

      {renderMenu(primaryMenu)}
      {renderMenu(settingsMenu)}

      <Card style={styles.menuCard}>
        <Pressable
          onPress={() => setSignOutModalVisible(true)}
          style={({pressed}) => [
            styles.menuRow,
            pressed ? styles.menuRowPressed : null,
          ]}>
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, styles.menuIconDanger]}>
              <LogOut size={18} color={theme.status.error} strokeWidth={2} />
            </View>
            <AppText variant="label" style={styles.menuLabelDanger}>
              {t('settingsSignOut')}
            </AppText>
          </View>
        </Pressable>
      </Card>

      <CenterModal
        visible={signOutModalVisible}
        onClose={() => setSignOutModalVisible(false)}
        title={t('settingsSignOutConfirmTitle')}>
        <Column gap={16}>
          <AppText variant="body" tone="secondary">
            {t('settingsSignOutConfirmBody')}
          </AppText>
          <Row gap={10}>
            <View style={{flex: 1}}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setSignOutModalVisible(false)}
              />
            </View>
            <View style={{flex: 1}}>
              <AppButton
                title={t('settingsSignOut')}
                variant="destructive"
                loading={logout.isPending}
                onPress={onConfirmSignOut}
              />
            </View>
          </Row>
        </Column>
      </CenterModal>

      <CenterModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
        title={t('themeSheetTitle')}>
        <Column gap={16}>
          <AppText variant="body" tone="secondary">
            {t('themeSheetSubtitle')}
          </AppText>
          <View style={styles.sheetList}>
            {THEME_OPTIONS.map(item => {
              const active = themePreference === item;
              const label =
                item === 'light'
                  ? t('light')
                  : item === 'dark'
                    ? t('dark')
                    : t('system');
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.sheetItem,
                    active && styles.sheetItemActive,
                  ]}
                  onPress={() => {
                    setTheme(item);
                    setThemeModalVisible(false);
                  }}>
                  <AppText
                    style={[
                      styles.itemLabel,
                      active && styles.itemLabelActive,
                    ]}>
                    {label}
                  </AppText>
                  {active ? (
                    <Check color={checkColor} size={18} strokeWidth={2.4} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Column>
      </CenterModal>

      <CenterModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title={t('languageSheetTitle')}>
        <Column gap={16}>
          <AppText variant="body" tone="secondary">
            {t('languageSheetSubtitle')}
          </AppText>
          <View style={styles.sheetList}>
            {LANGUAGE_OPTIONS.map(item => {
              const active = languagePreference === item;
              const label =
                item === 'en'
                  ? t('english')
                  : item === 'ar'
                    ? t('arabic')
                    : t('system');
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.sheetItem,
                    active && styles.sheetItemActive,
                  ]}
                  onPress={() => {
                    setLanguageModalVisible(false);
                    if (item === languagePreference) {
                      return;
                    }
                    void changeLanguage(item);
                  }}>
                  <AppText style={styles.flagText}>
                    {LANGUAGE_FLAGS[item]}
                  </AppText>
                  <AppText
                    style={[
                      styles.itemLabel,
                      active && styles.itemLabelActive,
                    ]}>
                    {label}
                  </AppText>
                  {active ? (
                    <Check color={checkColor} size={18} strokeWidth={2.4} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Column>
      </CenterModal>
    </ScreenContainer>
  );
};

export default ProfileScreen;
