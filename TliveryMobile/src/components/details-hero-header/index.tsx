import {type FC, type ReactNode, useMemo} from 'react';
import {Image, Pressable, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {getFlexDirection} from '@app/utils/directionalStyles';
import type {SoftTone} from '@app/theme/tokens';
import {statusSoftFor} from '@app/theme/tokens';
import {detailsHeroHeaderStyles} from './styles';

export type DetailsHeroMetaRow = {
  icon?: LucideIcon;
  text: string;
};

type DetailsHeroHeaderProps = {
  name: string;
  initials: string;
  statusLabel: string;
  statusTone?: SoftTone;
  metaRows?: DetailsHeroMetaRow[];
  photoUrl?: string | null;
  onAvatarPress?: () => void;
  avatarBadge?: ReactNode;
  footer?: ReactNode;
};

const initialsFromName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const DetailsHeroHeader: FC<DetailsHeroHeaderProps> = ({
  name,
  initials,
  statusLabel,
  statusTone = 'waiting',
  metaRows = [],
  photoUrl,
  onAvatarPress,
  avatarBadge,
  footer,
}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => detailsHeroHeaderStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const soft = statusSoftFor(themeType)[statusTone];
  const iconColor = theme.typography.secondary;
  const displayInitials = initials || initialsFromName(name);

  const avatar = (
    <View style={styles.avatarWrap}>
      <View style={styles.avatar}>
        {photoUrl ? (
          <Image source={{uri: photoUrl}} style={styles.avatarImage} />
        ) : (
          <AppText style={styles.avatarText}>{displayInitials}</AppText>
        )}
      </View>
      {avatarBadge}
    </View>
  );

  return (
    <View style={styles.heroCard}>
      <View
        style={[styles.heroTop, {flexDirection: getFlexDirection(direction)}]}>
        {onAvatarPress ? (
          <Pressable accessibilityRole="button" onPress={onAvatarPress}>
            {avatar}
          </Pressable>
        ) : (
          avatar
        )}

        <View style={styles.heroMeta}>
          <View
            style={[
              styles.nameRow,
              {flexDirection: getFlexDirection(direction)},
            ]}>
            <AppText style={styles.heroName} numberOfLines={1}>
              {name}
            </AppText>
            <View style={[styles.statusPill, {backgroundColor: soft.bg}]}>
              <AppText style={[styles.statusPillText, {color: soft.fg}]}>
                {statusLabel}
              </AppText>
            </View>
          </View>

          {metaRows.map((row, index) => {
            const Icon = row.icon;
            return (
              <View
                key={`${row.text}-${index}`}
                style={[
                  styles.metaRow,
                  {flexDirection: getFlexDirection(direction)},
                ]}>
                {Icon ? (
                  <Icon size={14} color={iconColor} strokeWidth={2.2} />
                ) : null}
                <AppText style={styles.metaText} numberOfLines={1}>
                  {row.text}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
};

export default DetailsHeroHeader;
