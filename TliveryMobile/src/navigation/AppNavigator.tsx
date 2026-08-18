import {FC, useCallback, useEffect} from 'react';
import {ActivityIndicator, Linking, StyleSheet, View} from 'react-native';
import {createURL} from 'expo-linking';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme,
  type LinkingOptions,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {navigationRef} from './RootNavigation';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {selectCanEnterMain, useUserStore} from '@app/features/user';
import {RootStackParamList} from '@app/types/navigation';
import HeaderBackButton from './components/header-back-button';
import MainTabNavigator from './MainTabNavigator';
import {CustomDrawerLayout} from './components/custom-drawer-layout';
import WaselDrawerContent from './components/wasel-drawer';
import {WaselSplashScreen} from '@app/features/splash';
import {SelectCountryScreen} from '@app/features/country';
import {OnboardingScreen} from '@app/features/onboarding';
import {ForgotPasswordScreen, LoginScreen} from '@app/features/login';
import {
  RegisterClientInviteScreen,
  RegisterCompanyScreen,
  RegisterDriverAccountScreen,
  RegisterDriverScreen,
  RegisterPendingScreen,
  RegisterRoleScreen,
} from '@app/features/signup';
import {
  CreateOrderScreen,
  LiveTrackingGate,
  OrderDetailsScreen,
  OrderPlacerDetailsScreen,
  OrdersScreen,
  ShipmentDetailsScreen,
} from '@app/features/orders';
import MapLocationPickerScreen from '@app/features/orders/screens/MapLocationPickerScreen';
import {NotificationsScreen} from '@app/features/notifications';
import {
  AddDriverScreen,
  CompanyDetailsScreen,
  DriverDetailsScreen,
  DriversMapScreen,
} from '@app/features/company';
import ComingSoonScreen from '@app/features/company/screens/ComingSoonScreen';
import MyVehicleScreen from '@app/features/profile/screens/MyVehicleScreen';
import EditMyVehicleScreen from '@app/features/profile/screens/EditMyVehicleScreen';
import MyDocumentsScreen from '@app/features/profile/screens/MyDocumentsScreen';
import AccountInfoScreen from '@app/features/profile/screens/AccountInfoScreen';
import CompleteClientProfileScreen from '@app/features/profile/screens/CompleteClientProfileScreen';
import AccountsHubScreen from '@app/features/finance/screens/AccountsHubScreen';
import FinancePartyListScreen from '@app/features/finance/screens/FinancePartyListScreen';
import FinanceLedgerScreen from '@app/features/finance/screens/FinanceLedgerScreen';
import UnifiedIssuedAccountsScreen from '@app/features/company/screens/UnifiedIssuedAccountsScreen';
import AddIssuedAccountScreen from '@app/features/company/screens/AddIssuedAccountScreen';
import IssuedAccountDetailsScreen from '@app/features/company/screens/IssuedAccountDetailsScreen';
import AddEmployeeScreen from '@app/features/employees/screens/AddEmployeeScreen';
import EmployeeDetailsScreen from '@app/features/employees/screens/EmployeeDetailsScreen';
import {useCountry} from '@app/providers/CountryContext';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import {
  isDriverApplicantSession,
  navigateAfterAuth,
} from './navigateAfterAuth';
import {useDriverLocationPresence} from '@app/hooks/useDriverLocationPresence';

const Stack = createNativeStackNavigator<RootStackParamList>();

const stashInviteCodeFromUrl = (url: string | null) => {
  if (!url) {
    return;
  }
  if (url.includes('driver-invite')) {
    const match = url.match(/[?&](?:inviteCode|code)=([^&]+)/i);
    if (match?.[1]) {
      storage.set(
        StorageKeys.PENDING_DRIVER_INVITE_CODE,
        decodeURIComponent(match[1]).toUpperCase(),
      );
    }
    return;
  }
  if (url.includes('client-invite')) {
    const match = url.match(/[?&](?:inviteCode|code)=([^&]+)/i);
    if (match?.[1]) {
      storage.set(
        StorageKeys.PENDING_CLIENT_INVITE_CODE,
        decodeURIComponent(match[1]).toUpperCase(),
      );
    }
  }
};

const pendingInviteFromStorage = () =>
  storage.getString(StorageKeys.PENDING_DRIVER_INVITE_CODE);

const routeForDriverInvite = (inviteCode?: string) => {
  const code = inviteCode ?? pendingInviteFromStorage() ?? undefined;
  const user = useUserStore.getState();
  if (
    user.id &&
    isDriverApplicantSession({
      phoneNumber: user.phoneNumber,
      email: user.email,
      companyId: user.companyId,
    })
  ) {
    return {
      name: 'RegisterDriver' as const,
      params: code ? {inviteCode: code} : undefined,
    };
  }
  if (user.id) {
    return null;
  }
  return {
    name: 'Login' as const,
    params: {method: 'phone' as const},
  };
};

const routeForClientInvite = (inviteCode?: string) => {
  const code =
    inviteCode ??
    storage.getString(StorageKeys.PENDING_CLIENT_INVITE_CODE) ??
    undefined;
  if (useUserStore.getState().id) {
    return null;
  }
  return {
    name: 'RegisterClientInvite' as const,
    params: code ? {inviteCode: code} : undefined,
  };
};

const isExpoGoLaunchUrl = (url: string) => {
  if (
    url.includes('driver-invite') ||
    url.includes('client-invite') ||
    url.includes('/--/')
  ) {
    return false;
  }
  return /^(exp|exps|http|https):\/\/([^/]+)\/?$/i.test(url.trim());
};

const waitForNavigationReady = async (timeoutMs = 10000) => {
  const startedAt = Date.now();
  while (!navigationRef.isReady()) {
    if (Date.now() - startedAt >= timeoutMs) {
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 32));
  }
  return true;
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [createURL('/'), 'tlivery://'],
  config: {
    screens: {
      RegisterDriver: {
        path: 'driver-invite',
        parse: {
          inviteCode: (code: string) => code?.toUpperCase?.() ?? code,
        },
      },
      RegisterClientInvite: {
        path: 'client-invite',
        parse: {
          inviteCode: (code: string) => code?.toUpperCase?.() ?? code,
        },
      },
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (!url || isExpoGoLaunchUrl(url)) {
      return null;
    }
    stashInviteCodeFromUrl(url);
    // Splash owns cold-start routing using the stashed code.
    if (url.includes('driver-invite') || url.includes('client-invite')) {
      return null;
    }
    return url;
  },
  subscribe(listener) {
    const sub = Linking.addEventListener('url', ({url}) => {
      stashInviteCodeFromUrl(url);
      if (url.includes('driver-invite')) {
        const match = url.match(/[?&](?:inviteCode|code)=([^&]+)/i);
        const code = match?.[1]
          ? decodeURIComponent(match[1]).toUpperCase()
          : undefined;
        const route = routeForDriverInvite(code);
        if (route && navigationRef.isReady()) {
          navigationRef.navigate(route.name, route.params as never);
        }
        return;
      }
      if (url.includes('client-invite')) {
        const match = url.match(/[?&](?:inviteCode|code)=([^&]+)/i);
        const code = match?.[1]
          ? decodeURIComponent(match[1]).toUpperCase()
          : undefined;
        const route = routeForClientInvite(code);
        if (route && navigationRef.isReady()) {
          navigationRef.navigate(route.name, route.params as never);
        }
        return;
      }
      listener(url);
    });
    return () => sub.remove();
  },
};

const renderHeaderBack = ({canGoBack}: {canGoBack?: boolean}) =>
  canGoBack ? <HeaderBackButton /> : null;

const SplashRoute: FC = () => {
  const {hasSelectedCountry} = useCountry();

  const onSplashFinished = useCallback(async () => {
    const ready = await waitForNavigationReady();
    if (!ready) {
      return;
    }

    if (!hasSelectedCountry) {
      navigationRef.reset({
        index: 0,
        routes: [{name: 'SelectCountry'}],
      });
      return;
    }

    await navigateAfterAuth();
  }, [hasSelectedCountry]);

  return <WaselSplashScreen onSplashFinished={onSplashFinished} />;
};

const MainTabsRoute: FC = () => {
  const canEnterMain = useUserStore(selectCanEnterMain);
  useDriverLocationPresence();

  useEffect(() => {
    if (!canEnterMain && navigationRef.isReady()) {
      navigationRef.reset({index: 0, routes: [{name: 'Splash'}]});
    }
  }, [canEnterMain]);

  if (!canEnterMain) {
    return null;
  }

  return (
    <CustomDrawerLayout drawerContent={<WaselDrawerContent />}>
      <MainTabNavigator />
    </CustomDrawerLayout>
  );
};

const AppNavigator: FC = () => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const rtl = isRTL(direction);

  const navTheme: Theme = {
    ...(themeType === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeType === 'dark' ? DarkTheme : DefaultTheme).colors,
      primary: theme.primary,
      background: theme.backgrounds.background,
      card: theme.navigation.background,
      text: theme.typography.primary,
      border: theme.ui.border,
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      linking={linking}
      fallback={
        <View style={navFallbackStyles.loader}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      }
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: {backgroundColor: theme.navigation.background},
          headerTintColor: theme.typography.primary,
          headerTitleStyle: {
            color: theme.typography.primary,
            ...cairoFont('medium'),
          },
          headerTitleAlign: 'center',
          contentStyle: {backgroundColor: theme.backgrounds.background},
          animation: rtl ? 'slide_from_left' : 'default',
          animationDuration: 150,
          headerBackVisible: !rtl,
          headerRight: rtl ? renderHeaderBack : undefined,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashRoute}
          options={{headerShown: false, animation: 'fade'}}
        />
        <Stack.Screen
          name="SelectCountry"
          component={SelectCountryScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{headerShown: false, animation: 'fade'}}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RegisterRole"
          component={RegisterRoleScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RegisterCompany"
          component={RegisterCompanyScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RegisterDriverAccount"
          component={RegisterDriverAccountScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RegisterClientInvite"
          component={RegisterClientInviteScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RegisterDriver"
          component={RegisterDriverScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RegisterPending"
          component={RegisterPendingScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabsRoute}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CreateOrder"
          component={CreateOrderScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MapLocationPicker"
          component={MapLocationPickerScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CompleteClientProfile"
          component={CompleteClientProfileScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="OrderDetails"
          component={OrderDetailsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ShipmentDetails"
          component={ShipmentDetailsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OrderPlacerDetails"
          component={OrderPlacerDetailsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LiveTracking"
          component={LiveTrackingGate}
          options={{headerShown: false, animation: 'fade'}}
        />
        <Stack.Screen
          name="DriversMap"
          component={DriversMapScreen}
          options={{headerShown: false, animation: 'fade'}}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CompanyDetails"
          component={CompanyDetailsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddDriver"
          component={AddDriverScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="DriverDetails"
          component={DriverDetailsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MyVehicle"
          component={MyVehicleScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="EditMyVehicle"
          component={EditMyVehicleScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MyDocuments"
          component={MyDocumentsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AccountInfo"
          component={AccountInfoScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="IssuedAccountDetails"
          component={IssuedAccountDetailsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AccountsHub"
          component={AccountsHubScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FinancePartyList"
          component={FinancePartyListScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FinanceLedger"
          component={FinanceLedgerScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MerchantAccounts"
          component={UnifiedIssuedAccountsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CustomerAccounts"
          component={UnifiedIssuedAccountsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Reports"
          component={ComingSoonScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddEmployee"
          component={AddEmployeeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddMerchant"
          component={AddIssuedAccountScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddClient"
          component={AddIssuedAccountScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddIssuedAccount"
          component={AddIssuedAccountScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="EmployeeDetails"
          component={EmployeeDetailsScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const navFallbackStyles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1B3A',
  },
});

export default AppNavigator;
