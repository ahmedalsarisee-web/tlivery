import {useMemo, type FC} from 'react';
import {Linking, Pressable, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  AtSign,
  ChevronLeft,
  ChevronRight,
  Phone,
  Store,
  UserRound,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import CornerFlagBadge from '@app/components/corner-flag-badge';
import type {CompanyIssuedAccount} from '@app/models/workflow.model';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {issuedAccountCardStyles} from './styles';

export type IssuedAccountKind = 'merchant' | 'client';

type IssuedAccountCardProps = {
  account: CompanyIssuedAccount;
  kind: IssuedAccountKind;
  showKindLabel?: boolean;
  onPress: () => void;
};

export const accountInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const IssuedAccountCard: FC<IssuedAccountCardProps> = ({
  account,
  kind,
  showKindLabel = false,
  onPress,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => issuedAccountCardStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const rtl = isRTL(direction);
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const accent = themeType === 'dark' ? theme.brand.gold : theme.brand.navy;
  const onAccent =
    themeType === 'dark' ? theme.brand.navy : theme.base.white;

  const name = account.displayName || account.username;
  const phone = account.phoneNumber?.trim() || '';
  const typeLabel =
    kind === 'merchant' ? t('accountTypeMerchant') : t('accountTypeCustomer');
  const TypeIcon = kind === 'merchant' ? Store : UserRound;
  const statusLabel = t(`employeeStatus_${account.status}`, {
    defaultValue: account.status,
  });

  const statusBadgeBg =
    account.status === 'active'
      ? accent
      : account.status === 'suspended' || account.status === 'disabled'
        ? theme.status.error
        : theme.typography.caption;
  const statusBadgeFg =
    account.status === 'active' ? onAccent : theme.base.white;

  const onCall = async () => {
    const tel = phone.replace(/\s+/g, '');
    if (!tel) {
      showToast(ToastType.info, t('phoneUnavailable'));
      return;
    }
    try {
      await Linking.openURL(`tel:${tel}`);
    } catch {
      showToast(ToastType.error, t('phoneOpenFailed'));
    }
  };

  return (
    <Card style={styles.card}>
      <CornerFlagBadge
        label={statusLabel}
        backgroundColor={statusBadgeBg}
        color={statusBadgeFg}
      />

      <View style={[styles.row, {flexDirection: getFlexDirection(direction)}]}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.colAvatar}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{accountInitials(name)}</AppText>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.colInfo}>
          <AppText style={styles.name} numberOfLines={1}>
            {name}
          </AppText>

          <View
            style={[
              styles.metaRow,
              {flexDirection: getFlexDirection(direction)},
            ]}>
            <View style={styles.metaIconBox}>
              <AtSign
                size={12}
                color={theme.typography.secondary}
                strokeWidth={2.2}
              />
            </View>
            <AppText style={styles.metaText} numberOfLines={1}>
              {account.username}
            </AppText>
          </View>

          <View
            style={[
              styles.metaRow,
              {flexDirection: getFlexDirection(direction)},
            ]}>
            <View style={styles.metaIconBox}>
              {showKindLabel ? (
                <TypeIcon
                  size={12}
                  color={theme.typography.secondary}
                  strokeWidth={2.2}
                />
              ) : (
                <Phone
                  size={12}
                  color={theme.typography.secondary}
                  strokeWidth={2.2}
                />
              )}
            </View>
            {showKindLabel ? (
              <>
                <AppText style={styles.metaText} numberOfLines={1}>
                  {typeLabel}
                </AppText>
                {phone ? (
                  <>
                    <View style={styles.metaSep} />
                    <AppText style={styles.metaText} numberOfLines={1}>
                      {phone}
                    </AppText>
                  </>
                ) : null}
              </>
            ) : (
              <AppText style={styles.metaText} numberOfLines={1}>
                {phone || t('phoneUnavailable')}
              </AppText>
            )}
          </View>
        </Pressable>

        <View style={styles.actionsDivider} />
        <View
          style={[
            styles.colActions,
            {flexDirection: getFlexDirection(direction)},
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('callCustomer')}
            hitSlop={6}
            onPress={() => {
              void onCall();
            }}
            style={styles.actionBtn}>
            <Phone size={16} color={onAccent} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            hitSlop={8}
            style={styles.chevronBtn}>
            <Chevron size={18} color={accent} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
};

export default IssuedAccountCard;
