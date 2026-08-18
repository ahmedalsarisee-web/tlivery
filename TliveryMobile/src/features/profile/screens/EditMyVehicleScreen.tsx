import {useEffect, useMemo, useState, type FC} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {selectUserId, useUserStore} from '@app/features/user';
import type {VehicleType} from '@app/features/company/types';
import {
  useMyDriverProfile,
  useUpdateMyVehicle,
} from '@app/hooks/useWorkflow';
import type {RootStackParamList} from '@app/types/navigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import Card from '@app/components/card';
import Column from '@app/components/column';
import FormField from '@app/components/form-field';
import FilterChips from '@app/components/filter-chips';

const VEHICLE_OPTIONS: VehicleType[] = ['motorcycle', 'car', 'van'];

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditMyVehicle'>;

const EditMyVehicleScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const userId = useUserStore(selectUserId);
  const driverQuery = useMyDriverProfile(userId);
  const updateVehicle = useUpdateMyVehicle();
  const driver = driverQuery.data;

  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceValidUntil, setInsuranceValidUntil] = useState('');

  useEffect(() => {
    if (!driver) {
      return;
    }
    setVehicleType(driver.vehicleType || 'motorcycle');
    setVehicleModel(driver.vehicleModel ?? '');
    setVehicleColor(driver.vehicleColor ?? '');
    setModelYear(driver.modelYear ? String(driver.modelYear) : '');
    setPlateNumber(driver.plateNumber ?? '');
    setLicenseNumber(driver.licenseNumber ?? '');
    setInsuranceValidUntil(driver.insuranceValidUntil ?? '');
  }, [driver]);

  const vehicleOptions = useMemo(
    () =>
      VEHICLE_OPTIONS.map(value => ({
        value,
        label: t(`vehicle_${value}`),
      })),
    [t],
  );

  const onSave = () => {
    const yearTrim = modelYear.trim();
    let parsedYear: number | null = null;
    if (yearTrim) {
      parsedYear = Number(yearTrim);
      if (!Number.isFinite(parsedYear) || parsedYear < 1980 || parsedYear > 2100) {
        showToast(ToastType.error, t('vehicleModelYearInvalid'));
        return;
      }
    }
    const insurance = insuranceValidUntil.trim();
    if (insurance && !/^\d{4}-\d{2}-\d{2}$/.test(insurance)) {
      showToast(ToastType.error, t('vehicleInsuranceDateInvalid'));
      return;
    }
    if (!plateNumber.trim()) {
      showToast(ToastType.error, t('driverFormRequired'));
      return;
    }

    updateVehicle.mutate(
      {
        vehicleType,
        vehicleModel: vehicleModel.trim(),
        vehicleColor: vehicleColor.trim(),
        modelYear: parsedYear,
        plateNumber: plateNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        insuranceValidUntil: insurance || null,
      },
      {
        onSuccess: () => {
          showToast(ToastType.success, t('vehicleSaved'));
          navigation.goBack();
        },
        onError: () => {
          showToast(ToastType.error, t('vehicleSaveFailed'));
        },
      },
    );
  };

  return (
    <ScreenContainer
      navTitle={t('editVehicleInfo')}
      loading={driverQuery.isLoading}
      keyboardAvoiding>
      <Column gap={14}>
        <Card>
          <Column gap={12}>
            <FormField label={t('vehicleTypeLabel')}>
              <FilterChips
                options={vehicleOptions}
                value={vehicleType}
                onChange={value => setVehicleType(value as VehicleType)}
              />
            </FormField>
            <FormField label={t('vehicleModelLabel')}>
              <AppTextInput
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder={t('vehicleModelPlaceholder')}
              />
            </FormField>
            <FormField label={t('vehicleColorLabel')}>
              <AppTextInput
                value={vehicleColor}
                onChangeText={setVehicleColor}
                placeholder={t('vehicleColorPlaceholder')}
              />
            </FormField>
            <FormField label={t('vehicleModelYearLabel')}>
              <AppTextInput
                value={modelYear}
                onChangeText={setModelYear}
                placeholder="2020"
                keyboardType="number-pad"
              />
            </FormField>
            <FormField label={t('vehiclePlateLabel')}>
              <AppTextInput
                value={plateNumber}
                onChangeText={setPlateNumber}
                placeholder={t('driverPlatePlaceholder')}
                autoCapitalize="characters"
              />
            </FormField>
            <FormField label={t('driverLicense')}>
              <AppTextInput
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder={t('driverLicensePlaceholder')}
              />
            </FormField>
            <FormField label={t('vehicleInsuranceExpiryLabel')}>
              <AppTextInput
                value={insuranceValidUntil}
                onChangeText={setInsuranceValidUntil}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
              />
            </FormField>
          </Column>
        </Card>

        <View>
          <AppButton
            title={t('save')}
            loading={updateVehicle.isPending}
            onPress={onSave}
          />
        </View>
      </Column>
    </ScreenContainer>
  );
};

export default EditMyVehicleScreen;
