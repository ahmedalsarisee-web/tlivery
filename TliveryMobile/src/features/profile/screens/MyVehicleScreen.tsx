import {useMemo, type FC} from 'react';
import {Image, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {selectUserId, useUserStore} from '@app/features/user';
import {useMyDriverProfile} from '@app/hooks/useWorkflow';
import type {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import Column from '@app/components/column';
import {profileStyles} from '../Profile.styles';

const MOTORCYCLE_HERO = require('@app/assets/images/wasel/vehicle/motorcycle-hero.png');

type Nav = NativeStackNavigationProp<RootStackParamList, 'MyVehicle'>;

const MyVehicleScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => profileStyles(theme, direction),
    [theme, direction],
  );
  const userId = useUserStore(selectUserId);
  const driverQuery = useMyDriverProfile(userId);
  const driver = driverQuery.data;

  const title =
    driver?.vehicleModel?.trim() ||
    (driver ? t(`vehicle_${driver.vehicleType}`) : t('myVehicle'));

  const rows: Array<{label: string; value: string}> = [
    {
      label: t('vehicleTypeLabel'),
      value: driver ? t(`vehicle_${driver.vehicleType}`) : '—',
    },
    {
      label: t('vehicleColorLabel'),
      value: driver?.vehicleColor?.trim() || '—',
    },
    {
      label: t('vehicleModelYearLabel'),
      value: driver?.modelYear ? String(driver.modelYear) : '—',
    },
    {
      label: t('vehiclePlateLabel'),
      value: driver?.plateNumber?.trim() || '—',
    },
    {
      label: t('vehicleInsuranceLabel'),
      value: driver?.insuranceValidUntil
        ? t('vehicleInsuranceValidUntil', {
            date: driver.insuranceValidUntil,
          })
        : '—',
    },
  ];

  return (
    <ScreenContainer
      navTitle={t('myVehicle')}
      loading={driverQuery.isLoading}
      pullToRefresh={{
        onRefresh: async () => {
          await driverQuery.refetch();
        },
      }}>
      <Column gap={12}>
        <View style={styles.vehicleHero}>
          <Image
            source={MOTORCYCLE_HERO}
            style={styles.vehicleHeroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.vehicleTitleRow}>
          <AppText variant="heading" style={styles.vehicleTitle}>
            {title}
          </AppText>
          {driver?.plateNumber ? (
            <View style={styles.plateBadge}>
              <AppText variant="caption" style={styles.plateText}>
                {driver.plateNumber}
              </AppText>
            </View>
          ) : null}
        </View>

        <Card>
          <Column gap={0}>
            {rows.map((row, index) => (
              <View key={row.label}>
                {index > 0 ? <View style={styles.infoDivider} /> : null}
                <View style={styles.infoRow}>
                  <AppText variant="caption" style={styles.infoLabel}>
                    {row.label}
                  </AppText>
                  <AppText variant="label" style={styles.infoValue}>
                    {row.value}
                  </AppText>
                </View>
              </View>
            ))}
          </Column>
        </Card>

        <AppButton
          title={t('editVehicleInfo')}
          onPress={() => navigation.navigate('EditMyVehicle')}
        />
      </Column>
    </ScreenContainer>
  );
};

export default MyVehicleScreen;
