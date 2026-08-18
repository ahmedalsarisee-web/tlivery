import {useMemo, type FC} from 'react';
import {ActivityIndicator, Pressable, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Clock3, Copy, KeyRound, MessageCircle, Phone} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import type {DriverInvite} from '@app/models/workflow.model';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {statusSoftFor} from '@app/theme/tokens';
import {inviteCardStyles} from './styles';

type InviteCardProps = {
  invite: DriverInvite;
  onWhatsApp?: () => void;
  onShare: () => void;
  onRevoke: () => void;
  revoking?: boolean;
};

const InviteCard: FC<InviteCardProps> = ({
  invite,
  onWhatsApp,
  onShare,
  onRevoke,
  revoking = false,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => inviteCardStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const soft = statusSoftFor(themeType).waiting;
  const iconColor =
    themeType === 'dark' ? theme.brand.gold : theme.brand.navy;
  const actionIconPrimary =
    themeType === 'dark' ? theme.brand.navy : theme.typography.inverse;
  const rowDir = getFlexDirection(direction);

  return (
    <Card style={styles.card}>
      <View style={[styles.mainRow, {flexDirection: rowDir}]}>
        <View style={[styles.statusRail, {backgroundColor: soft.bg}]}>
          <Clock3 size={14} color={soft.fg} strokeWidth={2.4} />
          <AppText style={[styles.statusRailLabel, {color: soft.fg}]}>
            {t('statusPending')}
          </AppText>
        </View>

        <View style={styles.content}>
          <View style={styles.body}>
            <View style={[styles.infoRow, {flexDirection: rowDir}]}>
              <View style={[styles.codeShell, {flexDirection: rowDir}]}>
                <KeyRound size={13} color={iconColor} strokeWidth={2.2} />
                <AppText style={styles.code} numberOfLines={1}>
                  {invite.code}
                </AppText>
              </View>
            </View>

            <View style={styles.metaBlock}>
              <View style={[styles.metaRow, {flexDirection: rowDir}]}>
                <View style={[styles.metaItemWide, {flexDirection: rowDir}]}>
                  <View style={styles.metaIconShell}>
                    <Phone size={12} color={iconColor} strokeWidth={2.2} />
                  </View>
                  <AppText style={styles.metaValue} numberOfLines={1}>
                    {invite.phoneNumber ?? t('inviteNoPhone')}
                  </AppText>
                </View>
              </View>
              <AppText style={styles.hint} numberOfLines={2}>
                {t('invitePendingHint')}
              </AppText>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={[styles.footerPrimaryRow, {flexDirection: rowDir}]}>
              {onWhatsApp ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onWhatsApp}
                  disabled={revoking}
                  style={[
                    styles.actionBtn,
                    styles.actionPrimary,
                    {flexDirection: rowDir},
                  ]}>
                  <MessageCircle
                    size={13}
                    color={actionIconPrimary}
                    strokeWidth={2.2}
                  />
                  <AppText
                    style={styles.actionPrimaryLabel}
                    numberOfLines={1}>
                    {t('resendWhatsApp')}
                  </AppText>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={onShare}
                disabled={revoking}
                style={[
                  styles.actionBtn,
                  styles.actionSecondary,
                  {flexDirection: rowDir},
                ]}>
                <Copy size={13} color={iconColor} strokeWidth={2.2} />
                <AppText
                  style={styles.actionSecondaryLabel}
                  numberOfLines={1}>
                  {t('copyInviteCode')}
                </AppText>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onRevoke}
              disabled={revoking}
              style={[
                styles.actionBtn,
                styles.actionDanger,
                styles.actionDangerFull,
                {flexDirection: rowDir},
              ]}>
              {revoking ? (
                <ActivityIndicator size="small" color={theme.status.error} />
              ) : (
                <AppText style={styles.actionDangerLabel} numberOfLines={1}>
                  {t('revokeInvite')}
                </AppText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );
};

export default InviteCard;
