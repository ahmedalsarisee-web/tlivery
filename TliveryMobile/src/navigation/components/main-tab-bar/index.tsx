import {useLayoutEffect, useMemo, useRef, useState, type FC} from 'react';
import {Pressable, Text, View} from 'react-native';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';
import {
  Home,
  Store,
  Truck,
  User,
  Users,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {
  selectCanManageDrivers,
  selectCanManageEmployees,
  selectCanManageOrders,
  selectIsCompanyStaff,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import TabBarShape from './TabBarShape';
import QuickActionsBall from './QuickActionsBall';
import QuickActionsSheet, {
  buildQuickActions,
  type QuickActionKey,
} from './QuickActionsSheet';
import OrdersTabIcon from './OrdersTabIcon';
import {mainTabBarStyles, useMainTabBarMetrics} from './styles';

/**
 * Invisible bridge: React Navigation still calls `tabBar`, but we must not
 * occupy its layout slot (that slot is what floated the bar). Props are
 * forwarded to the absolute overlay rendered by MainTabNavigator.
 */
export const MainTabBarBridge: FC<{
  props: BottomTabBarProps;
  onProps: (props: BottomTabBarProps) => void;
}> = ({props, onProps}) => {
  const signature = `${props.state.index}:${props.state.routes
    .map(r => r.key)
    .join(',')}`;
  const latest = useRef(props);
  latest.current = props;

  useLayoutEffect(() => {
    onProps(latest.current);
  }, [signature, onProps]);

  return null;
};

const MainTabBar: FC<
  BottomTabBarProps & {visibleRouteNames?: string[]}
> = ({state, descriptors, navigation, visibleRouteNames}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const isDark = themeType === 'dark';
  const metrics = useMainTabBarMetrics();
  const styles = useMemo(
    () => mainTabBarStyles(theme, direction, metrics, isDark),
    [theme, direction, metrics, isDark],
  );

  const role = useUserStore(selectUserRole);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canManageDrivers = useUserStore(selectCanManageDrivers);
  const canManageEmployees = useUserStore(selectCanManageEmployees);
  const canManageOrders = useUserStore(selectCanManageOrders);
  const [quickOpen, setQuickOpen] = useState(false);

  const actions = useMemo(
    () =>
      buildQuickActions({
        canManageDrivers,
        canManageEmployees,
        canCreateOrder:
          role === 'client' ||
          role === 'merchant' ||
          (isCompanyStaff && canManageOrders),
      }),
    [
      canManageDrivers,
      canManageEmployees,
      canManageOrders,
      isCompanyStaff,
      role,
    ],
  );

  const iconFor = (name: string, focused: boolean) => {
    const inactive = theme.navigation.inactiveTint;
    const active = theme.brand.gold;
    const outline = {
      size: 22,
      color: focused ? active : inactive,
      strokeWidth: focused ? 2.4 : 1.85,
    } as const;

    switch (name) {
      case 'HomeTab':
        return <Home {...outline} />;
      case 'OrdersTab':
        return (
          <OrdersTabIcon
            size={24}
            color={
              focused
                ? isDark
                  ? theme.brand.gold
                  : '#2C3A7A'
                : inactive
            }
            filled={focused}
            lineColor={isDark ? '#0B1526' : '#FFFFFF'}
          />
        );
      case 'DriversTab':
        return <Truck {...outline} />;
      case 'MerchantsTab':
        return <Store {...outline} />;
      case 'EmployeesTab':
        return <Users {...outline} />;
      case 'MoreTab':
        return <User {...outline} />;
      default:
        return <Home {...outline} />;
    }
  };

  const labelFor = (name: string) => {
    switch (name) {
      case 'HomeTab':
        return t('tabHome');
      case 'OrdersTab':
        return t('tabOrders');
      case 'DriversTab':
        return t('tabDrivers');
      case 'MerchantsTab':
        return t('navMerchants');
      case 'EmployeesTab':
        return t('navEmployees');
      case 'MoreTab':
        return t('tabProfile');
      default:
        return name;
    }
  };

  const onTabPress = (routeName: string, routeKey: string, focused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const onQuickSelect = (key: QuickActionKey) => {
    setQuickOpen(false);
    requestAnimationFrame(() => {
      const parent = navigation.getParent();
      switch (key) {
        case 'createOrder':
          parent?.navigate('CreateOrder');
          break;
        case 'addDriver':
          parent?.navigate('AddDriver');
          break;
        case 'addEmployee':
          parent?.navigate('AddEmployee');
          break;
        default:
          break;
      }
    });
  };

  const routes = useMemo(() => {
    if (!visibleRouteNames?.length) {
      return state.routes;
    }
    const allowed = new Set(visibleRouteNames);
    return state.routes.filter(route => allowed.has(route.name));
  }, [state.routes, visibleRouteNames]);
  const mid = Math.ceil(routes.length / 2);
  const leftRoutes = routes.slice(0, mid);
  const rightRoutes = routes.slice(mid);
  const barGradient = isDark
    ? (['#0B1526', '#122033', '#1A2A3D'] as const)
    : (['#FFFFFF', '#F5F7FB', '#E8EEF6'] as const);
  const strokeColor = isDark ? theme.ui.border : 'rgba(15,23,42,0.08)';

  const renderTab = (route: (typeof routes)[number], indexInState: number) => {
    const focused = state.index === indexInState;
    const {options} = descriptors[route.key];
    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? {selected: true} : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={() => onTabPress(route.name, route.key, focused)}
        style={styles.tabButton}>
        {iconFor(route.name, focused)}
        <Text
          numberOfLines={1}
          style={[styles.tabLabel, focused && styles.tabLabelActive]}>
          {labelFor(route.name)}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      <View
        style={[styles.container, {height: metrics.totalVisualHeight}]}
        pointerEvents="box-none">
        <View style={styles.shapeLayer} pointerEvents="none">
          <TabBarShape
            barHeight={metrics.totalBarHeight}
            cornerRadius={metrics.cornerRadius}
            humpRise={metrics.humpRise}
            fillColors={barGradient}
            strokeColor={strokeColor}
            strokeWidth={1}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.segment}>
            {leftRoutes.map(route =>
              renderTab(
                route,
                routes.findIndex(r => r.key === route.key),
              ),
            )}
          </View>

          <View style={styles.centerSlot}>
            <QuickActionsBall
              role={role}
              onPress={() => {
                if (actions.length === 0) {
                  return;
                }
                setQuickOpen(true);
              }}
              wrapStyle={styles.fabWrap}
              circleStyle={styles.fabCircle}
              pressedStyle={styles.fabPressed}
              innerStyle={styles.fabInner}
            />
          </View>

          <View style={styles.segment}>
            {rightRoutes.map(route =>
              renderTab(
                route,
                routes.findIndex(r => r.key === route.key),
              ),
            )}
          </View>
        </View>
      </View>

      <QuickActionsSheet
        visible={quickOpen}
        onClose={() => setQuickOpen(false)}
        actions={actions}
        onSelect={onQuickSelect}
      />
    </>
  );
};

export default MainTabBar;
