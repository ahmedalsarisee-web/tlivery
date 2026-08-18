import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useMemo, useState, type FC} from 'react';
import {Clipboard, Linking, Share, StyleSheet, View} from 'react-native';
import type {RootStackParamList} from '@app/types/navigation';
import {useCompany, useCreateClientInvite} from '@app/hooks/useWorkflow';
import {
  selectCanManageCustomers,
  selectCanManageMerchants,
  selectUserCompanyId,
  useUserStore,
} from '@app/features/user';
import {useTheme} from '@app/providers/ThemeContext';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import Column from '@app/components/column';
import SegmentedTabBar from '@app/components/segmented-tab-bar';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {getWorkflowErrorTranslationKey} from '@app/utils/workflowError';
import {buildClientInviteShareLinks} from '@app/utils/clientInvite';
import {fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddIssuedAccount'>;
type AccountKind = 'merchant' | 'client';

type InviteSharePayload = {
  code: string;
  message: string;
  link: string;
};

const openWhatsAppText = async (message: string) => {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
};

const AddIssuedAccountScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const {theme} = useTheme();
  const companyId = useUserStore(selectUserCompanyId);
  const company = useCompany(companyId);
  const canManageMerchants = useUserStore(selectCanManageMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const createClientInvite = useCreateClientInvite();

  const defaultKind: AccountKind = canManageMerchants ? 'merchant' : 'client';
  const [accountKind, setAccountKind] = useState<AccountKind>(defaultKind);
  const [inviteShare, setInviteShare] = useState<InviteSharePayload | null>(
    null,
  );

  const activeKind: AccountKind =
    accountKind === 'merchant' && canManageMerchants
      ? 'merchant'
      : accountKind === 'client' && canManageCustomers
        ? 'client'
        : defaultKind;

  const typeTabs = useMemo(() => {
    const tabs: {key: AccountKind; label: string}[] = [];
    if (canManageMerchants) {
      tabs.push({key: 'merchant', label: t('accountTypeMerchant')});
    }
    if (canManageCustomers) {
      tabs.push({key: 'client', label: t('accountTypeCustomer')});
    }
    return tabs;
  }, [canManageCustomers, canManageMerchants, t]);

  const companyName =
    (company.data as {companyName?: string; name?: string} | undefined)
      ?.companyName ||
    (company.data as {name?: string} | undefined)?.name ||
    t('appName');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        valueBox: {
          borderWidth: 1,
          borderColor: theme.border.subtle,
          backgroundColor: theme.backgrounds.surface,
          borderRadius: radius.md,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
        },
        codeValue: {
          fontFamily: cairoFont.bold,
          fontSize: fontSize.lg,
          color: theme.text.primary,
          letterSpacing: 1,
        },
        linkValue: {
          fontFamily: cairoFont.regular,
          fontSize: fontSize.sm,
          color: theme.text.primary,
        },
      }),
    [theme],
  );

  const onCreateClientInvite = () => {
    createClientInvite.mutate(
      {
        role: activeKind === 'merchant' ? 'merchant' : 'client',
      },
      {
        onSuccess: result => {
          const code = result.code || result.inviteCode;
          const webLink =
            result.inviteUrl?.trim() ||
            buildClientInviteShareLinks(code).primaryLink;
          const message = t('whatsappClientInviteMessage', {
            companyName: String(companyName),
            link: webLink,
            code,
          });
          setInviteShare({code, message, link: webLink});
          showToast(ToastType.success, t('clientInviteCreatedToast'));
        },
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  const copyValue = (value: string, successKey: string) => {
    Clipboard.setString(value);
    showToast(ToastType.success, t(successKey));
  };

  return (
    <ScreenContainer navTitle={t('inviteClientTitle')} showBack>
      <Column gap={space.md}>
        {typeTabs.length > 1 ? (
          <SegmentedTabBar
            tabs={typeTabs}
            activeKey={activeKind}
            onChange={key => setAccountKind(key)}
          />
        ) : null}

        <AppText>{t('inviteClientLead')}</AppText>
        <AppButton
          title={t('createClientInvite')}
          onPress={onCreateClientInvite}
          loading={createClientInvite.isPending}
          disabled={createClientInvite.isPending}
        />

        {inviteShare ? (
          <Card>
            <Column gap={space.md}>
              <AppText variant="label">{t('clientInviteReadyTitle')}</AppText>
              <AppText>{t('clientInviteReadyHint')}</AppText>

              <Column gap={space.xs}>
                <AppText variant="label">{t('inviteCode')}</AppText>
                <View style={styles.valueBox}>
                  <AppText style={styles.codeValue}>{inviteShare.code}</AppText>
                </View>
                <AppButton
                  title={t('copyInviteCode')}
                  variant="secondary"
                  onPress={() =>
                    copyValue(inviteShare.code, 'inviteCodeCopied')
                  }
                />
              </Column>

              <Column gap={space.xs}>
                <AppText variant="label">{t('inviteLink')}</AppText>
                <View style={styles.valueBox}>
                  <AppText style={styles.linkValue} selectable>
                    {inviteShare.link}
                  </AppText>
                </View>
                <AppButton
                  title={t('copyInviteLink')}
                  variant="secondary"
                  onPress={() =>
                    copyValue(inviteShare.link, 'inviteLinkCopied')
                  }
                />
              </Column>

              <AppButton
                title={t('whatsapp')}
                onPress={() => {
                  void openWhatsAppText(inviteShare.message).catch(() =>
                    showToast(ToastType.error, t('whatsappOpenFailed')),
                  );
                }}
              />
              <AppButton
                title={t('share')}
                variant="secondary"
                onPress={() => {
                  void Share.share({message: inviteShare.message});
                }}
              />
              <AppButton
                title={t('done')}
                variant="secondary"
                onPress={() => {
                  setInviteShare(null);
                  navigation.goBack();
                }}
              />
            </Column>
          </Card>
        ) : null}
      </Column>
    </ScreenContainer>
  );
};

export default AddIssuedAccountScreen;
