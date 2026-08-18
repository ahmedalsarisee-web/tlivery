import {useMemo, useState, FC, ReactNode} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Headphones,
  Languages,
  LogOut,
  Moon,
  User,
  Wallet,
} from 'lucide-react-native';
import {
  useTheme,
  ThemePreference,
} from '@app/providers/ThemeContext';
import {useLanguage, LangPreference} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import {
  selectCanManageCustomers,
  selectCanViewMerchants,
  selectIsCompanyAdmin,
  selectUserName,
  useUserStore,
} from '@app/features/user';
import {useLogout} from '@app/hooks/useAuth';
import {useCompany, useCompanyDrivers} from '@app/hooks/useWorkflow';
import {RootStackParamList} from '@app/types/navigation';
import {getHeight, getWidth, moderateScale} from '@app/utils/responsive-design';
import {getFlexDirection, getTextAlign, isRTL} from '@app/utils/directionalStyles';
import ScreenContainer from '@app/components/screen-container';
import CenterModal from '@app/components/center-modal';
import AppButton from '@app/components/app-button';
import Card from '@app/components/card';
import Column from '@app/components/column';
import Row from '@app/components/row';
import AppText from '@app/components/app-text';
import brand from '@app/config/brand';
import {cairoFont} from '@app/theme/fonts';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
const LANGUAGE_OPTIONS: LangPreference[] = ['system', 'en', 'ar'];
const LANGUAGE_FLAGS: Record<LangPreference, string> = {
  system: '🌐',
  en: '🇪🇺',
  ar: '🇸🇦',
};

const PlaceholderBody: FC<{title: string; body: string}> = ({title, body}) => (
  <ScreenContainer
    navTitle={title}
    pullToRefresh={{
      onRefresh: async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 350));
      },
    }}>
    <Column gap={8}>
      <AppText variant="subtitle">{body}</AppText>
    </Column>
  </ScreenContainer>
);

export const DriversTabScreen: FC = () => {
  const {t} = useTranslation();
  return (
    <PlaceholderBody title={t('tabDrivers')} body={t('driversPlaceholder')} />
  );
};

export const ReportsTabScreen: FC = () => {
  const {t} = useTranslation();
  const isCompanyAdmin = useUserStore(selectIsCompanyAdmin);
  const companyId = useUserStore(state => state.companyId);
  const companyQuery = useCompany(isCompanyAdmin ? companyId : null);
  const driversQuery = useCompanyDrivers(isCompanyAdmin ? companyId : null);
  const company = companyQuery.data;
  const drivers = driversQuery.data?.drivers ?? [];
  const driverTotal = driversQuery.data?.total ?? drivers.length;

  if (!isCompanyAdmin) {
    return (
      <PlaceholderBody title={t('tabReports')} body={t('reportsPlaceholder')} />
    );
  }

  return (
    <ScreenContainer
      navTitle={t('tabReports')}
      loading={companyQuery.isLoading || driversQuery.isLoading}
      pullToRefresh={{
        onRefresh: async () => {
          await Promise.all([companyQuery.refetch(), driversQuery.refetch()]);
        },
      }}>
      <Column gap={4}>
        <AppText variant="subtitle">{t('reportsSubtitleCompany')}</AppText>
      </Column>
      <Card>
        <Column gap={12}>
          <AppText variant="heading">
            {company?.name ?? t('companyDetails')}
          </AppText>
          <Row justify="space-between">
            <AppText variant="caption">{t('openOrders')}</AppText>
            <AppText variant="label">—</AppText>
          </Row>
          <Row justify="space-between">
            <AppText variant="caption">{t('pendingAssign')}</AppText>
            <AppText variant="label">—</AppText>
          </Row>
          <Row justify="space-between">
            <AppText variant="caption">{t('driversOnline')}</AppText>
            <AppText variant="label">
              {drivers.filter(driver => driver.status === 'active').length}/
              {driverTotal}
            </AppText>
          </Row>
          <Row justify="space-between">
            <AppText variant="caption">{t('driversCapacityLabel')}</AppText>
            <AppText variant="label">{company?.maxDrivers ?? 0}</AppText>
          </Row>
        </Column>
      </Card>
    </ScreenContainer>
  );
};

type SettingsNav = NativeStackNavigationProp<RootStackParamList>;

const SettingsRow: FC<{
  icon: ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}> = ({icon, label, subtitle, onPress, trailing}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const Chevron = isRTL(direction) ? (
    <ChevronLeft size={18} color={theme.typography.caption} />
  ) : (
    <ChevronRight size={18} color={theme.typography.caption} />
  );

  const iconBg =
    themeType === 'dark'
      ? 'rgba(212, 175, 55, 0.2)'
      : 'rgba(212, 175, 55, 0.14)';

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Row justify="space-between" gap={12}>
        <Row gap={12} flex={1}>
          <View
            style={{
              width: getWidth(36),
              height: getWidth(36),
              borderRadius: getWidth(10),
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {icon}
          </View>
          <Column gap={2} flex={1}>
            <AppText variant="label">{label}</AppText>
            {subtitle ? (
              <AppText variant="caption">{subtitle}</AppText>
            ) : null}
          </Column>
        </Row>
        {trailing ?? (onPress ? Chevron : null)}
      </Row>
    </Pressable>
  );
};

const preferenceSheetStyles = (theme: ThemeType, direction: LangDirection) =>
  StyleSheet.create({
    sheetList: {
      gap: getHeight(4),
      paddingBottom: getHeight(2),
    },
    sheetItem: {
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(10),
      paddingVertical: getHeight(8),
      paddingHorizontal: getWidth(12),
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(8),
    },
    sheetItemActive: {
      backgroundColor: theme.ui.borderLight,
      borderColor: theme.brand.gold,
    },
    flagText: {
      fontSize: moderateScale(18),
      textAlign: 'center',
      minWidth: getWidth(28),
      lineHeight: moderateScale(22),
    },
    itemLabel: {
      flex: 1,
      color: theme.typography.primary,
      fontSize: moderateScale(14),
      textAlign: getTextAlign(direction),
      writingDirection: isRTL(direction) ? 'rtl' : 'ltr',
      ...cairoFont('medium'),
    },
    itemLabelActive: {
      ...cairoFont('bold'),
    },
  });

export const MoreTabScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<SettingsNav>();
  const logout = useLogout();
  const {theme, themePreference, setTheme, themeType} = useTheme();
  const {direction, languagePreference, changeLanguage} = useLanguage();
  const {country} = useCountry();
  const userName = useUserStore(selectUserName);
  const isCompanyAdmin = useUserStore(selectIsCompanyAdmin);
  const canViewMerchants = useUserStore(selectCanViewMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const role = useUserStore(state => state.role);
  const isCompanyStaff =
    role === 'company_admin' || role === 'company_employee';
  const isIssuedAccount = role === 'client' || role === 'merchant';
  const companyId = useUserStore(state => state.companyId);
  const company = useCompany(companyId).data;
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const sheetStyles = useMemo(
    () => preferenceSheetStyles(theme, direction),
    [theme, direction],
  );

  const iconColor =
    themeType === 'dark' ? theme.brand.gold : '#0F172A';

  const displayName = userName ?? t('settingsProfileName');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');

  const onConfirmSignOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setSignOutModalVisible(false);
        navigation.replace('Login');
      },
    });
  };

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

  const checkColor =
    themeType === 'dark' ? theme.brand.gold : theme.brand.navy;

  return (
    <ScreenContainer
      navTitle={t('tabSettings')}
      pullToRefresh={{
        onRefresh: async () => {
          await new Promise<void>(resolve => setTimeout(resolve, 350));
        },
      }}>
      <Column gap={4}>
        <AppText variant="subtitle">{t('settingsSubtitle')}</AppText>
        {isIssuedAccount ? (
          <AppText variant="caption" tone="secondary">
            {t('issuedAccountMoreHint')}
          </AppText>
        ) : null}
      </Column>

      <Card>
        <Row gap={12}>
          <View
            style={{
              width: getWidth(48),
              height: getWidth(48),
              borderRadius: getWidth(24),
              borderWidth: 1.5,
              borderColor: theme.brand.gold,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <AppText variant="heading" style={{color: theme.brand.gold}}>
              {initials || 'WA'}
            </AppText>
          </View>
          <Column gap={2} flex={1}>
            <AppText variant="heading">{displayName}</AppText>
            <AppText variant="caption">
              {isCompanyAdmin || isIssuedAccount
                ? company?.name ?? brand.name
                : brand.name}
            </AppText>
          </Column>
        </Row>
      </Card>

      {isCompanyStaff ? (
        <Card>
          <Column gap={14}>
            <SettingsRow
              icon={<Wallet size={18} color={iconColor} strokeWidth={2} />}
              label={t('navAccounts')}
              onPress={() => navigation.navigate('AccountsHub')}
            />
            {canViewMerchants || canManageCustomers ? (
              <SettingsRow
                icon={<Building2 size={18} color={iconColor} strokeWidth={2} />}
                label={t('navIssuedAccounts')}
                onPress={() => navigation.navigate('MerchantsTab')}
              />
            ) : null}
            <SettingsRow
              icon={<BarChart3 size={18} color={iconColor} strokeWidth={2} />}
              label={t('navReports')}
              onPress={() => navigation.navigate('Reports')}
            />
          </Column>
        </Card>
      ) : null}

      <Card>
        <Column gap={14}>
          <SettingsRow
            icon={<User size={18} color={iconColor} strokeWidth={2} />}
            label={t('settingsAccount')}
          />
          <SettingsRow
            icon={<Bell size={18} color={iconColor} strokeWidth={2} />}
            label={t('settingsNotifications')}
            onPress={() => navigation.navigate('Notifications')}
          />
          <SettingsRow
            icon={<Building2 size={18} color={iconColor} strokeWidth={2} />}
            label={
              isCompanyAdmin
                ? t('settingsCompanyProfile')
                : t('settingsCompanies')
            }
            subtitle={
              isCompanyAdmin ? company?.code : undefined
            }
            onPress={() =>
              navigation.navigate(
                isCompanyAdmin ? 'CompanyDetails' : 'Orders',
              )
            }
          />
          <SettingsRow
            icon={<Headphones size={18} color={iconColor} strokeWidth={2} />}
            label={t('settingsSupport')}
          />
        </Column>
      </Card>

      <Card>
        <Column gap={14}>
          <SettingsRow
            icon={<Moon size={18} color={iconColor} strokeWidth={2} />}
            label={t('theme')}
            subtitle={themeLabel}
            onPress={() => setThemeModalVisible(true)}
            trailing={<View />}
          />
          <SettingsRow
            icon={<Languages size={18} color={iconColor} strokeWidth={2} />}
            label={t('language')}
            subtitle={languageLabel}
            onPress={() => setLanguageModalVisible(true)}
            trailing={<View />}
          />
          <SettingsRow
            icon={<Globe size={18} color={iconColor} strokeWidth={2} />}
            label={t('country')}
            subtitle={`${country.flag} ${t(country.nameKey)}`}
            onPress={() =>
              navigation.navigate('SelectCountry', {mode: 'change'})
            }
            trailing={<View />}
          />
        </Column>
      </Card>

      <Card>
        <SettingsRow
          icon={<LogOut size={18} color={theme.status.error} strokeWidth={2} />}
          label={t('settingsSignOut')}
          onPress={() => setSignOutModalVisible(true)}
          trailing={<View />}
        />
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
          <View style={sheetStyles.sheetList}>
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
                    sheetStyles.sheetItem,
                    active && sheetStyles.sheetItemActive,
                  ]}
                  onPress={() => {
                    setTheme(item);
                    setThemeModalVisible(false);
                  }}>
                  <AppText
                    style={[
                      sheetStyles.itemLabel,
                      active && sheetStyles.itemLabelActive,
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
          <View style={sheetStyles.sheetList}>
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
                    sheetStyles.sheetItem,
                    active && sheetStyles.sheetItemActive,
                  ]}
                  onPress={() => {
                    setLanguageModalVisible(false);
                    if (item === languagePreference) {
                      return;
                    }
                    void changeLanguage(item);
                  }}>
                  <AppText style={sheetStyles.flagText}>
                    {LANGUAGE_FLAGS[item]}
                  </AppText>
                  <AppText
                    style={[
                      sheetStyles.itemLabel,
                      active && sheetStyles.itemLabelActive,
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
