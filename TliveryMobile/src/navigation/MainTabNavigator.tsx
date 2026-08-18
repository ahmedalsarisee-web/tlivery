import {useCallback, useMemo, useState, type ComponentType, type FC} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';
import {MainTabParamList} from '@app/types/navigation';
import {RoleHomeGate} from '@app/features/home';
import {OrdersScreen} from '@app/features/orders';
import {DriversScreen} from '@app/features/company';
import MerchantsTabScreen from '@app/features/company/screens/MerchantsTabScreen';
import EmployeesTabScreen from '@app/features/employees/screens/EmployeesTabScreen';
import ProfileScreen from '@app/features/profile/screens/ProfileScreen';
import MainTabBar, {MainTabBarBridge} from './components/main-tab-bar';
import {
  selectCanManageCustomers,
  selectCanManageDrivers,
  selectCanManageEmployees,
  selectCanViewMerchants,
  selectCanViewOrders,
  selectIsCompanyStaff,
  selectUserRole,
  useUserStore,
} from '@app/features/user';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Visible slots in the floating bar; overflow stays reachable via the drawer. */
export const MAX_BOTTOM_TABS = 4;

type TabDef = {
  name: keyof MainTabParamList;
  component: ComponentType;
  titleKey: string;
};

export function pickVisibleTabNames(
  candidates: Array<keyof MainTabParamList>,
  max = MAX_BOTTOM_TABS,
): Array<keyof MainTabParamList> {
  const withoutMore = candidates.filter(name => name !== 'MoreTab');
  const hasMore = candidates.includes('MoreTab');
  if (!hasMore) {
    return withoutMore.slice(0, max);
  }
  return [...withoutMore.slice(0, max - 1), 'MoreTab'];
}

const MainTabNavigator: FC = () => {
  const {t} = useTranslation();
  const role = useUserStore(selectUserRole);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canViewOrders = useUserStore(selectCanViewOrders);
  const canManageDrivers = useUserStore(selectCanManageDrivers);
  const canViewMerchants = useUserStore(selectCanViewMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const canManageEmployees = useUserStore(selectCanManageEmployees);
  const [tabBarProps, setTabBarProps] = useState<BottomTabBarProps | null>(
    null,
  );

  const onTabBarProps = useCallback((props: BottomTabBarProps) => {
    setTabBarProps(props);
  }, []);

  const showHome = true;
  const showOrders = isCompanyStaff ? canViewOrders : true;

  const tabs = useMemo(() => {
    const next: TabDef[] = [];
    if (showHome) {
      next.push({
        name: 'HomeTab',
        component: RoleHomeGate,
        titleKey: 'tabHome',
      });
    }
    if (showOrders) {
      next.push({
        name: 'OrdersTab',
        component: OrdersScreen,
        titleKey: 'tabOrders',
      });
    }
    if (canManageDrivers) {
      next.push({
        name: 'DriversTab',
        component: DriversScreen,
        titleKey: 'tabDrivers',
      });
    }
    if (canViewMerchants || canManageCustomers) {
      next.push({
        name: 'MerchantsTab',
        component: MerchantsTabScreen,
        titleKey: 'navMerchants',
      });
    }
    if (canManageEmployees) {
      next.push({
        name: 'EmployeesTab',
        component: EmployeesTabScreen,
        titleKey: 'navEmployees',
      });
    }
    next.push({
      name: 'MoreTab',
      component: ProfileScreen,
      titleKey: 'tabProfile',
    });
    return next;
  }, [
    canManageCustomers,
    canManageDrivers,
    canManageEmployees,
    canViewMerchants,
    showHome,
    showOrders,
  ]);

  const visibleTabNames = useMemo(
    () => pickVisibleTabNames(tabs.map(tab => tab.name)),
    [tabs],
  );

  return (
    <View style={styles.root}>
      <Tab.Navigator
        tabBar={props => (
          <MainTabBarBridge props={props} onProps={onTabBarProps} />
        )}
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarStyle: {
            height: 0,
            position: 'absolute',
            opacity: 0,
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: 'transparent',
          },
          sceneStyle: {
            backgroundColor: 'transparent',
          },
        }}>
        {tabs.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{title: t(tab.titleKey)}}
          />
        ))}
      </Tab.Navigator>

      {tabBarProps ? (
        <MainTabBar {...tabBarProps} visibleRouteNames={visibleTabNames} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default MainTabNavigator;
