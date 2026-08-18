import {
  CommonActions,
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import type {MainTabParamList, RootStackParamList} from '@app/types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate(name as string, params));
  }
}

export function replace<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name as string, params));
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function getCurrentRoute() {
  return navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;
}

/**
 * Drawer / hub jump to a main tab: return to MainTabs (drop stack overlays)
 * and switch the tab. Avoids stacked "back" history from drawer hops.
 */
export function navigateMainTab(screen: keyof MainTabParamList) {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'MainTabs',
      params: {screen},
    }),
  );
}

/**
 * Drawer jump to a root stack screen sitting above MainTabs.
 * Replaces any existing overlay so back always returns to tabs (not a chain
 * of previous drawer destinations).
 */
export function navigateRootOverlay<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name],
) {
  if (!navigationRef.isReady()) {
    return;
  }
  const state = navigationRef.getRootState();
  const current = state.routes[state.index];
  if (current?.name === name) {
    return;
  }
  if (current?.name === 'MainTabs') {
    navigationRef.dispatch(CommonActions.navigate(name as string, params));
    return;
  }
  navigationRef.dispatch(StackActions.replace(name as string, params));
}
