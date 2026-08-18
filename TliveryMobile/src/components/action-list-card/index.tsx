import {useMemo, type FC, type ReactNode} from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import AppText from '@app/components/app-text';
import StatusChip, {type StatusChipTone} from '@app/components/status-chip';
import {actionListCardStyles} from './styles';

export type ActionListCardAction = {
  key: string;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger' | 'muted';
  disabled?: boolean;
  loading?: boolean;
};

type Props = {
  title: string;
  icon: LucideIcon;
  statusLabel?: string;
  statusTone?: StatusChipTone;
  subtitle?: string;
  metric?: string;
  metaLines?: string[];
  accentColor?: string;
  actions?: ActionListCardAction[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  footerExtra?: ReactNode;
};

const ActionListCard: FC<Props> = ({
  title,
  icon: Icon,
  statusLabel,
  statusTone = 'waiting',
  subtitle,
  metric,
  metaLines,
  accentColor,
  actions,
  onPress,
  style,
  footerExtra,
}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const rtl = isRTL(direction);
  const accent = accentColor ?? theme.brand.gold;
  const styles = useMemo(
    () => actionListCardStyles(theme, rtl, accent, themeType === 'dark'),
    [theme, rtl, accent, themeType],
  );

  const body = (
    <>
      <View style={styles.accent} />
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        onPress={onPress}
        disabled={!onPress}
        style={styles.row}>
        <View style={styles.iconShell}>
          <Icon size={18} color={accent} strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <AppText style={styles.title} numberOfLines={2}>
              {title}
            </AppText>
            {statusLabel ? (
              <StatusChip label={statusLabel} tone={statusTone} />
            ) : null}
          </View>
          {subtitle ? (
            <AppText style={styles.meta} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
          {metric ? (
            <AppText style={styles.metric} numberOfLines={1}>
              {metric}
            </AppText>
          ) : null}
          {(metaLines ?? []).map(line => (
            <AppText key={line} style={styles.meta} numberOfLines={2}>
              {line}
            </AppText>
          ))}
        </View>
      </Pressable>
      {actions && actions.length > 0 ? (
        <View style={styles.footer}>
          {actions.map(action => {
            const tone = action.tone ?? 'primary';
            const btnStyle =
              tone === 'danger'
                ? styles.actionDanger
                : tone === 'muted'
                  ? styles.actionMuted
                  : styles.actionPrimary;
            const textStyle =
              tone === 'danger'
                ? styles.actionDangerText
                : tone === 'muted'
                  ? styles.actionMutedText
                  : styles.actionPrimaryText;
            const loadingColor =
              tone === 'danger'
                ? theme.status.error
                : tone === 'muted'
                  ? theme.typography.caption
                  : theme.brand.navy;
            return (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                onPress={action.onPress}
                disabled={action.disabled || action.loading}
                style={[
                  styles.actionBtn,
                  btnStyle,
                  (action.disabled || action.loading) && {opacity: 0.5},
                ]}>
                {action.loading ? (
                  <ActivityIndicator size="small" color={loadingColor} />
                ) : (
                  <AppText style={textStyle}>{action.label}</AppText>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {footerExtra ? <View>{footerExtra}</View> : null}
    </>
  );

  return <View style={[styles.card, style]}>{body}</View>;
};

export default ActionListCard;
