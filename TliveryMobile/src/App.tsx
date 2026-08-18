import {useEffect, useState, type FC} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClientProvider} from '@tanstack/react-query';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_700Bold,
  useFonts,
} from '@expo-google-fonts/cairo';
import {queryClient} from '@app/config/queryClient';
import {ThemeProvider} from '@app/providers/ThemeContext';
import {LangProvider} from '@app/providers/LangContext';
import {CountryProvider} from '@app/providers/CountryContext';
import {useAuthSessionSync} from '@app/hooks/useAuthSessionSync';
import {initI18n} from '@app/I18n';
import ErrorBoundary from '@app/components/error-boundary';
import NetworkToastListener from '@app/utils/networkToastListener';
import ToastHost from '@app/components/toast-host';
import AppNavigator from '@app/navigation/AppNavigator';
import {setupApiPerfLogging} from '@app/utils/apiPerf';
import {hydrateStorage} from '@app/store/mmkv';
import '@app/store/storageUtils';
import '@app/firebase/firebaseApp';

setupApiPerfLogging();

const Loader: FC = () => (
  <View style={styles.loader}>
    <ActivityIndicator size="large" />
  </View>
);

const Shell: FC = () => {
  useAuthSessionSync();

  return (
    <LangProvider>
      <CountryProvider>
        <ErrorBoundary>
          <View style={styles.flex}>
            <NetworkToastListener />
            <AppNavigator />
          </View>
        </ErrorBoundary>
        <ToastHost />
      </CountryProvider>
    </LangProvider>
  );
};

function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontWaitTimedOut, setFontWaitTimedOut] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'Cairo-Regular': Cairo_400Regular,
    'Cairo-Medium': Cairo_500Medium,
    'Cairo-Bold': Cairo_700Bold,
  });

  useEffect(() => {
    hydrateStorage()
      .then(() => initI18n())
      .finally(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFontWaitTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = fontsLoaded || Boolean(fontError) || fontWaitTimedOut;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          {fontsReady && i18nReady ? (
            <KeyboardProvider statusBarTranslucent>
              <ThemeProvider>
                <Shell />
              </ThemeProvider>
            </KeyboardProvider>
          ) : (
            <Loader />
          )}
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});

export default App;
