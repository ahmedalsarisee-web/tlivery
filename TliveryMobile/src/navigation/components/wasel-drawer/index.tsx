import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FC,
} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  ClipboardList,
  Home,
  LogOut,
  Store,
  Truck,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {LangDirection} from '@app/enums/LangDirection';
import {getFlexDirection} from '@app/utils/directionalStyles';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import CenterModal from '@app/components/center-modal';
import Column from '@app/components/column';
import Row from '@app/components/row';
import {
  selectCanManageCustomers,
  selectCanManageDrivers,
  selectCanManageEmployees,
  selectCanViewMerchants,
  selectCanViewOrders,
  selectIsCompanyStaff,
  selectUserCompanyId,
  selectUserName,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import {useLogout} from '@app/hooks/useAuth';
import {useCompany} from '@app/hooks/useWorkflow';
import {
  navigateMainTab,
  navigateRootOverlay,
  navigationRef,
} from '@app/navigation/RootNavigation';
import {useOptionalCustomDrawer} from '@app/navigation/components/custom-drawer-layout';
import type {MainTabParamList, RootStackParamList} from '@app/types/navigation';
import VerticalGradientBg from '@app/components/vertical-gradient-bg';
import DoodleBackground from '@app/components/doodle-background';
import {createWaselDrawerStyles} from './styles';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {space} from '@app/theme/tokens';

type DrawerNavKey =
  | 'home'
  | 'orders'
  | 'drivers'
  | 'merchants'
  | 'employees'
  | 'accounts'
  | 'reports'
  | 'company'
  | 'notifications'
  | 'settings';

const ACCOUNTS_ROUTES = new Set([
  'AccountsHub',
  'FinancePartyList',
  'FinanceLedger',
]);

const MERCHANTS_ROUTES = new Set([
  'MerchantsTab',
  'MerchantAccounts',
  'CustomerAccounts',
  'AddIssuedAccount',
  'AddMerchant',
  'AddClient',
  'IssuedAccountDetails',
]);

type DrawerItem = {
  key: DrawerNavKey;
  labelKey: string;
  Icon: LucideIcon;
  section?: 'main' | 'company' | 'utility';
};

const DrawerNavRow: FC<{
  label: string;
  Icon: ComponentType<{color: string; size: number; strokeWidth?: number}>;
  active: boolean;
  accent: string;
  muted: string;
  direction: LangDirection;
  styles: ReturnType<typeof createWaselDrawerStyles>;
  onPress: () => void;
}> = ({label, Icon, active, accent, muted, direction, styles, onPress}) => {
  const color = active ? accent : muted;
  return (
    <View style={styles.itemOuter}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: active}}
        onPress={onPress}
        style={[
          styles.itemRow,
          {flexDirection: getFlexDirection(direction)},
          active && styles.itemRowActive,
        ]}>
        {active ? (
          <View style={[styles.accentBar, styles.accentBarStart]} />
        ) : null}
        <Icon color={color} size={22} strokeWidth={2.2} />
        <AppText
          numberOfLines={1}
          style={[
            styles.itemLabel,
            {color},
            active && styles.itemLabelActive,
          ]}>
          {label}
        </AppText>
      </Pressable>
    </View>
  );
};

export const WaselDrawerContent: FC = () => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const insets = useSafeAreaInsets();
  const drawer = useOptionalCustomDrawer();
  const logout = useLogout();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => createWaselDrawerStyles(theme, isDark),
    [theme, isDark],
  );
  const heroGradient = (
    isDark
      ? (['#3D3010', theme.brand.gold] as const)
      : (theme.gradient.header as unknown as readonly [string, string])
  );

  const name = useUserStore(selectUserName);
  const role = useUserStore(selectUserRole);
  const companyId = useUserStore(selectUserCompanyId);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canViewOrders = useUserStore(selectCanViewOrders);
  const canManageDrivers = useUserStore(selectCanManageDrivers);
  const canViewMerchants = useUserStore(selectCanViewMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const canManageEmployees = useUserStore(selectCanManageEmployees);
  const companyQuery = useCompany(companyId);
  const company = companyQuery.data;

  const accent = isDark ? theme.brand.gold : theme.brand.navy;
  const muted = theme.typography.secondary;

  const displayName = name?.trim() || t('settingsProfileName');
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'WA';

  const roleLabel = useMemo(() => {
    switch (role) {
      case 'company_admin':
        return t('roleCompanyAdmin');
      case 'company_employee':
        return t('roleCompanyEmployee');
      case 'driver':
        return t('roleDriver');
      case 'client':
        return t('roleClient');
      case 'merchant':
        return t('roleMerchant');
      default:
        return '';
    }
  }, [role, t]);

  const companyName = company?.name?.trim() || company?.legalName?.trim() || '';
  const companyCode = company?.code?.trim() || '';
  const showCompanyMeta = Boolean(companyId && (companyName || companyCode));
  const companyMetaLabel = companyName
    ? companyCode
      ? `${companyName} · ${companyCode}`
      : companyName
    : companyCode;

  const items = useMemo(() => {
    const next: DrawerItem[] = [];
    next.push({key: 'home', labelKey: 'tabHome', Icon: Home, section: 'main'});
    if (canViewOrders || !isCompanyStaff || role === 'client' || role === 'merchant') {
      next.push({
        key: 'orders',
        labelKey: 'tabOrders',
        Icon: ClipboardList,
        section: 'main',
      });
    }
    if (canManageDrivers) {
      next.push({
        key: 'drivers',
        labelKey: 'tabDrivers',
        Icon: Truck,
        section: 'main',
      });
    }
    if (canViewMerchants || canManageCustomers) {
      next.push({
        key: 'merchants',
        labelKey: 'navMerchants',
        Icon: Store,
        section: 'company',
      });
    }
    if (canManageEmployees) {
      next.push({
        key: 'employees',
        labelKey: 'navEmployees',
        Icon: Users,
        section: 'company',
      });
    }
    if (isCompanyStaff) {
      next.push({
        key: 'company',
        labelKey: 'companyDetails',
        Icon: Building2,
        section: 'company',
      });
      next.push({
        key: 'accounts',
        labelKey: 'navAccounts',
        Icon: Wallet,
        section: 'company',
      });
      next.push({
        key: 'reports',
        labelKey: 'navReports',
        Icon: BarChart3,
        section: 'company',
      });
    } else if (
      role === 'driver' ||
      role === 'client' ||
      role === 'merchant'
    ) {
      next.push({
        key: 'accounts',
        labelKey: 'navAccounts',
        Icon: Wallet,
        section: 'utility',
      });
    }
    next.push({
      key: 'notifications',
      labelKey: 'notifications',
      Icon: Bell,
      section: 'utility',
    });
    next.push({
      key: 'settings',
      labelKey: 'tabProfile',
      Icon: User,
      section: 'utility',
    });
    return next;
  }, [
    canManageCustomers,
    canManageDrivers,
    canManageEmployees,
    canViewMerchants,
    canViewOrders,
    isCompanyStaff,
    role,
  ]);

  const closeThen = useCallback(
    (action: () => void) => {
      drawer?.closeDrawer();
      requestAnimationFrame(action);
    },
    [drawer],
  );

  const goTab = useCallback(
    (screen: keyof MainTabParamList) => {
      closeThen(() => navigateMainTab(screen));
    },
    [closeThen],
  );

  const goStack = useCallback(
    <K extends keyof RootStackParamList>(name: K) => {
      closeThen(() => navigateRootOverlay(name));
    },
    [closeThen],
  );

  const onNavigate = useCallback(
    (key: DrawerNavKey) => {
      switch (key) {
        case 'home':
          goTab('HomeTab');
          break;
        case 'orders':
          goTab('OrdersTab');
          break;
        case 'drivers':
          goTab('DriversTab');
          break;
        case 'merchants':
          goTab('MerchantsTab');
          break;
        case 'employees':
          goTab('EmployeesTab');
          break;
        case 'company':
          goStack('CompanyDetails');
          break;
        case 'accounts':
          goStack('AccountsHub');
          break;
        case 'reports':
          goStack('Reports');
          break;
        case 'notifications':
          goStack('Notifications');
          break;
        case 'settings':
          goTab('MoreTab');
          break;
        default:
          break;
      }
    },
    [goStack, goTab],
  );

  const onLogoutPress = () => {
    drawer?.closeDrawer();
    setSignOutOpen(true);
  };

  const onConfirmSignOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setSignOutOpen(false);
        if (navigationRef.isReady()) {
          navigationRef.reset({index: 0, routes: [{name: 'Login'}]});
        }
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const [currentRoute, setCurrentRoute] = useState<string | undefined>(() =>
    navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined,
  );

  useEffect(() => {
    const sync = () => {
      setCurrentRoute(navigationRef.getCurrentRoute()?.name);
    };
    sync();
    const unsubscribe = navigationRef.addListener('state', sync);
    return unsubscribe;
  }, []);

  const isActive = (key: DrawerNavKey) => {
    if (!currentRoute) {
      return false;
    }
    switch (key) {
      case 'home':
        return currentRoute === 'HomeTab';
      case 'orders':
        return (
          currentRoute === 'OrdersTab' ||
          currentRoute === 'Orders' ||
          currentRoute === 'OrderDetails' ||
          currentRoute === 'ShipmentDetails' ||
          currentRoute === 'OrderPlacerDetails' ||
          currentRoute === 'LiveTracking' ||
          currentRoute === 'CreateOrder' ||
          currentRoute === 'MapLocationPicker'
        );
      case 'drivers':
        return (
          currentRoute === 'DriversTab' ||
          currentRoute === 'DriversMap' ||
          currentRoute === 'AddDriver' ||
          currentRoute === 'DriverDetails'
        );
      case 'merchants':
        return MERCHANTS_ROUTES.has(currentRoute);
      case 'employees':
        return (
          currentRoute === 'EmployeesTab' ||
          currentRoute === 'AddEmployee' ||
          currentRoute === 'EmployeeDetails'
        );
      case 'company':
        return currentRoute === 'CompanyDetails';
      case 'accounts':
        return ACCOUNTS_ROUTES.has(currentRoute);
      case 'reports':
        return currentRoute === 'Reports';
      case 'notifications':
        return currentRoute === 'Notifications';
      case 'settings':
        return currentRoute === 'MoreTab';
      default:
        return false;
    }
  };

  const mainItems = items.filter(i => i.section === 'main');
  const companyItems = items.filter(i => i.section === 'company');
  const utilityItems = items.filter(i => i.section === 'utility');

  const renderGroup = (group: DrawerItem[]) =>
    group.map(item => (
      <DrawerNavRow
        key={item.key}
        label={t(item.labelKey)}
        Icon={item.Icon}
        active={isActive(item.key)}
        accent={accent}
        muted={muted}
        direction={direction}
        styles={styles}
        onPress={() => onNavigate(item.key)}
      />
    ));

  return (
    <View
      style={[styles.root, {backgroundColor: theme.backgrounds.surface}]}>
      <DoodleBackground tileScale={0.72} />
      <View style={[styles.hero, {paddingTop: insets.top + 8}]}>
        <VerticalGradientBg colors={heroGradient} showDoodle />
        <View
          style={[
            styles.profileRow,
            {flexDirection: getFlexDirection(direction)},
          ]}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initials}</AppText>
          </View>
          <View style={styles.userMeta}>
            <View
              style={[
                styles.metaLine,
                {flexDirection: getFlexDirection(direction)},
              ]}>
              <User
                color="rgba(255,255,255,0.9)"
                size={14}
                strokeWidth={2.2}
              />
              <AppText style={styles.userName} numberOfLines={1}>
                {displayName}
              </AppText>
            </View>
            {roleLabel ? (
              <View
                style={[
                  styles.metaLine,
                  {flexDirection: getFlexDirection(direction)},
                ]}>
                <Briefcase
                  color="rgba(255,255,255,0.78)"
                  size={14}
                  strokeWidth={2.2}
                />
                <AppText style={styles.userRole} numberOfLines={1}>
                  {roleLabel}
                </AppText>
              </View>
            ) : null}
            {showCompanyMeta ? (
              <View
                style={[
                  styles.metaLine,
                  {flexDirection: getFlexDirection(direction)},
                ]}>
                <Building2
                  color="rgba(255,255,255,0.85)"
                  size={14}
                  strokeWidth={2.2}
                />
                <AppText style={styles.companyMetaText} numberOfLines={1}>
                  {companyMetaLabel}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {mainItems.length ? renderGroup(mainItems) : null}
        {companyItems.length ? (
          <>
            <View style={styles.divider} />
            {renderGroup(companyItems)}
          </>
        ) : null}
        {utilityItems.length ? (
          <>
            <View style={styles.divider} />
            {renderGroup(utilityItems)}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 12)}]}>
        <Pressable
          accessibilityRole="button"
          onPress={onLogoutPress}
          style={[
            styles.itemRow,
            {flexDirection: getFlexDirection(direction)},
          ]}>
          <LogOut color={theme.status.error} size={22} strokeWidth={2.2} />
          <AppText style={styles.logoutLabel}>{t('settingsSignOut')}</AppText>
        </Pressable>
        <AppText style={styles.version}>{t('poweredByWasel')}</AppText>
      </View>

      <CenterModal
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title={t('settingsSignOutConfirmTitle')}>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {t('settingsSignOutConfirmBody')}
          </AppText>
          <Row gap={space.sm}>
            <View style={{flex: 1}}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setSignOutOpen(false)}
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
    </View>
  );
};

export default WaselDrawerContent;
