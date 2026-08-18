import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Copy, Share2} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import BottomSheetModal from '@app/components/bottom-sheet-modal';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Column from '@app/components/column';
import Row from '@app/components/row';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {
  buildIssuedAccountCredentialsMessage,
  openWhatsAppCredentials,
  shareCredentialsText,
} from '@app/utils/shareCredentials';
import {brand, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type ShareCredentialsPayload = {
  roleLabel: string;
  username: string;
  password: string;
  companyName?: string;
};

type ShareCredentialsSheetProps = {
  visible: boolean;
  onClose: () => void;
  credentials: ShareCredentialsPayload | null;
};

const ShareCredentialsSheet: FC<ShareCredentialsSheetProps> = ({
  visible,
  onClose,
  credentials,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const iconColor =
    themeType === 'dark' ? theme.brand.gold : theme.brand.navy;

  const message = useMemo(() => {
    if (!credentials) {
      return '';
    }
    return buildIssuedAccountCredentialsMessage(credentials);
  }, [credentials]);

  const onShare = async () => {
    if (!message) {
      return;
    }
    try {
      await shareCredentialsText(message);
    } catch {
      showToast(ToastType.error, t('credentialsShareFailed'));
    }
  };

  const onWhatsApp = async () => {
    if (!message) {
      return;
    }
    try {
      await openWhatsAppCredentials(message);
    } catch {
      showToast(ToastType.error, t('credentialsShareFailed'));
    }
  };

  const onCopy = async () => {
    if (!message) {
      return;
    }
    try {
      await shareCredentialsText(message);
      showToast(ToastType.success, t('credentialsCopied'));
    } catch {
      showToast(ToastType.error, t('credentialsShareFailed'));
    }
  };

  return (
    <BottomSheetModal
      visible={visible && credentials != null}
      onClose={onClose}
      title={t('shareCredentialsTitle')}
      subtitle={t('shareCredentialsSubtitle')}
      minHeight={280}
      headerSurface="sheet">
      {credentials ? (
        <Column gap={space.md}>
          <View
            style={[
              styles.credBox,
              {
                backgroundColor: theme.ui.borderLight,
                borderColor: theme.ui.border,
              },
            ]}>
            <Column gap={space.xs}>
              <AppText variant="caption" tone="secondary">
                {t('employeeUsername')}
              </AppText>
              <AppText style={styles.credValue} selectable>
                {credentials.username}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {t('employeePassword')}
              </AppText>
              <AppText style={styles.credValue} selectable>
                {credentials.password}
              </AppText>
            </Column>
          </View>

          <AppText variant="caption" tone="secondary">
            {t('shareCredentialsOnceHint')}
          </AppText>

          <Row gap={space.sm}>
            <View style={styles.flex}>
              <AppButton title={t('share')} onPress={() => void onShare()} />
            </View>
            <View style={styles.flex}>
              <AppButton
                title={t('whatsapp')}
                variant="secondary"
                onPress={() => void onWhatsApp()}
              />
            </View>
          </Row>

          <Pressable
            accessibilityRole="button"
            onPress={() => void onCopy()}
            style={styles.copyRow}>
            <Copy size={16} color={iconColor} strokeWidth={2.2} />
            <AppText variant="caption">{t('copyCredentials')}</AppText>
            <Share2 size={14} color={theme.typography.caption} strokeWidth={2} />
          </Pressable>

          <AppButton
            title={t('done')}
            variant="secondary"
            onPress={onClose}
          />
        </Column>
      ) : null}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  credBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: getWidth(space.md),
  },
  credValue: {
    fontSize: fontSize.body,
    ...cairoFont('medium'),
    color: brand.textPrimary,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getWidth(space.xs),
    minHeight: getHeight(44),
  },
  flex: {flex: 1},
});

export default ShareCredentialsSheet;
