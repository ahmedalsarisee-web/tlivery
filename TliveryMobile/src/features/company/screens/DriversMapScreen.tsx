import {useMemo, useState, type FC} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import FullScreenMapChrome from '@app/components/live-tracking/FullScreenMapChrome';
import FleetDriversMap from '@app/components/live-tracking/FleetDriversMap';
import FleetDriverInfoCard from '@app/components/live-tracking/FleetDriverInfoCard';
import AppText from '@app/components/app-text';
import {useCompanyDriverLocations} from '@app/hooks/useCompanyDriverLocations';
import {useCompanyDrivers} from '@app/hooks/useWorkflow';
import {
  selectCanManageDrivers,
  selectUserCompanyId,
  useUserStore,
} from '@app/features/user';
import {useTheme} from '@app/providers/ThemeContext';
import type {RootStackParamList} from '@app/types/navigation';
import {cairoFont} from '@app/theme/fonts';
import {fontSize} from '@app/theme/tokens';
import {getHeight} from '@app/utils/responsive-design';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DriversMapScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const companyId = useUserStore(selectUserCompanyId);
  const canManageDrivers = useUserStore(selectCanManageDrivers);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const {locations, loading, error, isListening} = useCompanyDriverLocations(
    companyId,
    {pauseWhenBlurred: true, enabled: Boolean(companyId)},
  );

  const driversQuery = useCompanyDrivers(companyId, {
    status: 'active',
    pageSize: 100,
  });
  const drivers = driversQuery.data?.drivers ?? [];

  const selectedLocation = useMemo(
    () => locations.find(loc => loc.driverId === selectedDriverId) ?? null,
    [locations, selectedDriverId],
  );

  const selectedDriver = useMemo(
    () => drivers.find(driver => driver.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId],
  );

  const onTripCount = useMemo(
    () => locations.filter(loc => Boolean(loc.orderId)).length,
    [locations],
  );

  const subtitle = useMemo(() => {
    if (error) {
      return error.message;
    }
    if (loading && locations.length === 0) {
      return t('fleetMapLoading');
    }
    if (locations.length === 0) {
      return t('fleetMapEmpty');
    }
    if (selectedLocation) {
      return selectedLocation.driverName?.trim() || t('driver');
    }
    return `${t('fleetMapSummary', {
      total: locations.length,
      onTrip: onTripCount,
    })}${isListening ? ` · ${t('live')}` : ''}`;
  }, [
    error,
    loading,
    locations.length,
    onTripCount,
    isListening,
    selectedLocation,
    t,
  ]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sheetBody: {
          gap: getHeight(6),
        },
        title: {
          fontSize: fontSize.body,
          color: theme.typography.primary,
          ...cairoFont('bold'),
        },
        subtitle: {
          fontSize: fontSize.caption,
          color: theme.typography.secondary,
          ...cairoFont('regular'),
        },
      }),
    [theme],
  );

  const sheetContent = (
    <View style={styles.sheetBody}>
      {!selectedLocation ? (
        <>
          <AppText style={styles.title}>{t('driversMap')}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
          <AppText style={styles.subtitle}>{t('fleetTapDriverHint')}</AppText>
        </>
      ) : (
        <FleetDriverInfoCard
          location={selectedLocation}
          driver={selectedDriver}
          onClose={() => setSelectedDriverId(null)}
          onOpenDetails={
            canManageDrivers
              ? () =>
                  navigation.navigate('DriverDetails', {
                    driverId: selectedLocation.driverId,
                  })
              : undefined
          }
        />
      )}
    </View>
  );

  return (
    <View style={{flex: 1}}>
      <StatusBar
        barStyle={themeType === 'dark' ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <FullScreenMapChrome
        sheetContent={sheetContent}
        map={
          <FleetDriversMap
            locations={locations}
            loading={loading}
            fullScreen
            hideBanner
            selectedDriverId={selectedDriverId}
            onSelectDriver={setSelectedDriverId}
          />
        }
      />
    </View>
  );
};

export default DriversMapScreen;
