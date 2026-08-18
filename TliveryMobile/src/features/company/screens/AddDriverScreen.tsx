import {useMemo, useState, FC} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from '@app/types/navigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import CountryPhoneInput from '@app/components/country-phone-input';
import {isValidNationalNumber, toE164} from '@app/config/countries';
import {useCountry} from '@app/providers/CountryContext';
import Card from '@app/components/card';
import Column from '@app/components/column';
import {useUserStore} from '@app/features/user';
import {
  useCompany,
  useCompanyDrivers,
  useCreateDriverInvite,
} from '@app/hooks/useWorkflow';
import {
  buildDriverInviteDeepLink,
  openWhatsAppInvite,
  shareInviteCode,
} from '@app/utils/whatsappInvite';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddDriver'>;

const AddDriverScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const {countryIso} = useCountry();
  const companyId = useUserStore(state => state.companyId);
  const company = useCompany(companyId).data;
  const driversQuery = useCompanyDrivers(companyId);
  const drivers = driversQuery.data?.drivers ?? [];
  const driverTotal = driversQuery.data?.total ?? drivers.length;
  const createInvite = useCreateDriverInvite();

  const [phone, setPhone] = useState('');
  const [lastInvite, setLastInvite] = useState<{
    code: string;
    phoneE164: string;
  } | null>(null);

  const atCapacity = useMemo(
    () => company != null && driverTotal >= company.maxDrivers,
    [company, driverTotal],
  );

  const inviteMessage = (code: string) =>
    t('whatsappDriverInviteMessage', {
      companyName: company?.name ?? 'Wasel',
      code,
      link: buildDriverInviteDeepLink(code),
    });

  const sendWhatsApp = async (phoneE164: string, code: string) => {
    try {
      await openWhatsAppInvite({
        phoneE164,
        message: inviteMessage(code),
      });
    } catch {
      showToast(ToastType.error, t('whatsappOpenFailed'));
    }
  };

  const onSendInvite = () => {
    if (atCapacity) {
      showToast(ToastType.error, t('driverCapacityReached'));
      return;
    }
    if (!isValidNationalNumber(countryIso, phone)) {
      showToast(ToastType.error, t('driverFormRequired'));
      return;
    }
    const phoneE164 = toE164(countryIso, phone);
    createInvite.mutate(phoneE164, {
      onSuccess: async result => {
        const code = result.code;
        setLastInvite({code, phoneE164});
        showToast(ToastType.success, t('driverInviteCreated', {code}));
        await sendWhatsApp(phoneE164, code);
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  return (
    <ScreenContainer keyboardAvoiding navTitle={t('addDriver')}>
      <Column gap={4}>
        <AppText variant="subtitle">{t('addDriverInviteSubtitle')}</AppText>
      </Column>

      <Card>
        <Column gap={12}>
          <CountryPhoneInput
            label={t('driverPhone')}
            value={phone}
            onChangeText={setPhone}
            required
          />
        </Column>
      </Card>

      {atCapacity ? (
        <AppText variant="caption" tone="secondary">
          {t('driverCapacityReached')}
        </AppText>
      ) : null}

      <AppButton
        title={t('sendWhatsAppInvite')}
        onPress={onSendInvite}
        loading={createInvite.isPending}
        disabled={atCapacity}
      />

      {lastInvite ? (
        <Card>
          <Column gap={12}>
            <AppText variant="label">{t('inviteCode')}</AppText>
            <AppText variant="heading">{lastInvite.code}</AppText>
            <AppButton
              title={t('resendWhatsApp')}
              variant="secondary"
              onPress={() =>
                sendWhatsApp(lastInvite.phoneE164, lastInvite.code)
              }
            />
            <AppButton
              title={t('copyInviteCode')}
              variant="secondary"
              onPress={async () => {
                await shareInviteCode(lastInvite.code);
                showToast(ToastType.success, t('inviteCodeCopied'));
              }}
            />
          </Column>
        </Card>
      ) : null}

      <AppButton
        title={t('cancel')}
        variant="secondary"
        onPress={() => navigation.goBack()}
      />
    </ScreenContainer>
  );
};

export default AddDriverScreen;
