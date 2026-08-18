import {useMemo, useState, type FC} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Camera, FileText, IdCard, Shield} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {selectUserId, useUserStore} from '@app/features/user';
import {
  useMyDriverProfile,
  useUpdateMyVehicle,
} from '@app/hooks/useWorkflow';
import {driverInitials} from '@app/components/driver-card';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Column from '@app/components/column';
import CenterModal from '@app/components/center-modal';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {space} from '@app/theme/tokens';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {
  pickCompressedDriverImage,
  type DriverImageKind,
} from '@app/utils/compressImage';
import {uploadDriverImage} from '@app/services/DriverMediaService';
import {myDocumentsStyles} from './MyDocuments.styles';

const MyDocumentsScreen: FC = () => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const userId = useUserStore(selectUserId);
  const driverQuery = useMyDriverProfile(userId);
  const updateVehicle = useUpdateMyVehicle();
  const driver = driverQuery.data;
  const styles = useMemo(
    () => myDocumentsStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const [uploadingKind, setUploadingKind] = useState<DriverImageKind | null>(
    null,
  );
  const [mediaPickerKind, setMediaPickerKind] =
    useState<DriverImageKind | null>(null);
  const iconColor =
    themeType === 'dark' ? theme.brand.gold : theme.brand.navy;

  const urlFieldForKind = (
    kind: DriverImageKind,
  ):
    | 'photoUrl'
    | 'licenseImageUrl'
    | 'registrationImageUrl'
    | 'insuranceImageUrl' => {
    switch (kind) {
      case 'avatar':
        return 'photoUrl';
      case 'license':
        return 'licenseImageUrl';
      case 'registration':
        return 'registrationImageUrl';
      case 'insurance':
        return 'insuranceImageUrl';
    }
  };

  const runMediaUpload = async (
    kind: DriverImageKind,
    source: 'library' | 'camera',
  ) => {
    if (!driver?.companyId || !driver.id) {
      return;
    }
    try {
      const picked = await pickCompressedDriverImage(kind, source);
      if (!picked) {
        return;
      }
      setUploadingKind(kind);
      const url = await uploadDriverImage({
        companyId: driver.companyId,
        driverId: driver.id,
        kind,
        localUri: picked.uri,
        contentType: picked.type,
      });
      await updateVehicle.mutateAsync({
        [urlFieldForKind(kind)]: url,
      });
      showToast(
        ToastType.success,
        kind === 'avatar' ? t('photoUpdated') : t('documentImageUpdated'),
      );
    } catch {
      showToast(ToastType.error, t('photoUploadFailed'));
    } finally {
      setUploadingKind(null);
    }
  };

  const promptMediaUpload = (kind: DriverImageKind) => {
    setMediaPickerKind(kind);
  };

  const onPickMediaSource = (source: 'library' | 'camera') => {
    const kind = mediaPickerKind;
    setMediaPickerKind(null);
    if (!kind) {
      return;
    }
    void runMediaUpload(kind, source);
  };

  const docs = driver
    ? [
        {
          title: t('driverLicenseDoc'),
          sub: driver.licenseNumber || t('notSet'),
          imageUrl: driver.licenseImageUrl,
          kind: 'license' as const,
          Icon: IdCard,
        },
        {
          title: t('vehicleRegistration'),
          sub: driver.plateNumber || t('notSet'),
          imageUrl: driver.registrationImageUrl,
          kind: 'registration' as const,
          Icon: FileText,
        },
        {
          title: t('vehicleInsuranceDoc'),
          sub: driver.insuranceValidUntil || t('notSet'),
          imageUrl: driver.insuranceImageUrl,
          kind: 'insurance' as const,
          Icon: Shield,
        },
      ]
    : [];

  return (
    <ScreenContainer
      navTitle={t('profileDocuments')}
      loading={driverQuery.isLoading}
      pullToRefresh={{
        onRefresh: async () => {
          await driverQuery.refetch();
        },
      }}>
      {!driver ? (
        <AppText variant="body">{t('driverNotFound')}</AppText>
      ) : (
        <Column gap={space.md}>
          <View style={styles.heroCard}>
            <Pressable
              accessibilityRole="button"
              onPress={() => promptMediaUpload('avatar')}
              disabled={uploadingKind === 'avatar'}
              style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {driver.photoUrl ? (
                  <Image
                    source={{uri: driver.photoUrl}}
                    style={styles.avatarImage}
                  />
                ) : (
                  <AppText style={styles.avatarText}>
                    {driverInitials(driver.fullName)}
                  </AppText>
                )}
              </View>
              <View style={styles.avatarCamBadge}>
                {uploadingKind === 'avatar' ? (
                  <ActivityIndicator size="small" color={theme.base.white} />
                ) : (
                  <Camera
                    size={12}
                    color={theme.base.white}
                    strokeWidth={2.4}
                  />
                )}
              </View>
            </Pressable>
            <View style={styles.heroMeta}>
              <AppText style={styles.heroName}>{driver.fullName}</AppText>
              <AppText style={styles.heroHint}>
                {driver.photoUrl ? t('changePhoto') : t('uploadPhoto')}
              </AppText>
            </View>
          </View>

          {docs.map(doc => {
            const Icon = doc.Icon;
            const uploading = uploadingKind === doc.kind;
            return (
              <View key={doc.kind} style={styles.docBlock}>
                <View
                  style={[
                    styles.docCard,
                    {flexDirection: getFlexDirection(direction)},
                  ]}>
                  {doc.imageUrl ? (
                    <Image
                      source={{uri: doc.imageUrl}}
                      style={styles.docThumb}
                    />
                  ) : (
                    <View style={styles.docIcon}>
                      <Icon size={18} color={iconColor} strokeWidth={2.2} />
                    </View>
                  )}
                  <View style={styles.docBody}>
                    <AppText style={styles.docTitle}>{doc.title}</AppText>
                    <AppText style={styles.docSub} numberOfLines={1}>
                      {doc.sub}
                    </AppText>
                  </View>
                </View>
                <AppButton
                  title={
                    doc.imageUrl
                      ? t('changeDocumentImage')
                      : t('uploadDocumentImage')
                  }
                  variant="secondary"
                  loading={uploading}
                  onPress={() => promptMediaUpload(doc.kind)}
                />
              </View>
            );
          })}
        </Column>
      )}

      <CenterModal
        visible={mediaPickerKind != null}
        onClose={() => setMediaPickerKind(null)}
        title={t(
          mediaPickerKind === 'avatar' ? 'uploadPhoto' : 'uploadDocumentImage',
        )}>
        <Column gap={space.sm}>
          <AppButton
            title={t('pickFromLibrary')}
            variant="secondary"
            onPress={() => onPickMediaSource('library')}
          />
          <AppButton
            title={t('takePhoto')}
            onPress={() => onPickMediaSource('camera')}
          />
          <AppButton
            title={t('cancel')}
            variant="secondary"
            onPress={() => setMediaPickerKind(null)}
          />
        </Column>
      </CenterModal>
    </ScreenContainer>
  );
};

export default MyDocumentsScreen;
