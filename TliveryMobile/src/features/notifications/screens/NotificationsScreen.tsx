import {useCallback, useMemo, useState, FC} from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  Truck,
  Building2,
  Info,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import ScreenContainer from '@app/components/screen-container';
import {MOCK_NOTIFICATIONS} from '../data/mockNotifications';
import {AppNotification, NotificationKind} from '../types';
import {notificationsStyles} from './Notifications.styles';

type Filter = 'all' | 'unread';

const NotificationsScreen: FC = () => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const styles = useMemo(
    () => notificationsStyles(theme, direction),
    [theme, direction],
  );
  const ForwardChevron = isRTL(direction) ? ChevronLeft : ChevronRight;

  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<Filter>('all');

  const unreadCount = useMemo(
    () => items.filter(n => n.unread).length,
    [items],
  );

  const visible = useMemo(() => {
    if (filter === 'unread') {
      return items.filter(n => n.unread);
    }
    return items;
  }, [filter, items]);

  const today = useMemo(
    () => visible.filter(n => n.group === 'today'),
    [visible],
  );
  const earlier = useMemo(
    () => visible.filter(n => n.group === 'earlier'),
    [visible],
  );

  const markAllRead = useCallback(() => {
    setItems(prev => prev.map(n => ({...n, unread: false})));
  }, []);

  const markRead = useCallback((id: string) => {
    setItems(prev =>
      prev.map(n => (n.id === id ? {...n, unread: false} : n)),
    );
  }, []);

  const kindStyle = (kind: NotificationKind) => {
    switch (kind) {
      case 'order':
        return {
          bg: `${theme.status.info}22`,
          fg: theme.status.info,
          Icon: Package,
        };
      case 'delivery':
        return {
          bg: `${theme.status.success}22`,
          fg: theme.status.success,
          Icon: Truck,
        };
      case 'carrier':
        return {
          bg: `${theme.brand.gold}22`,
          fg: theme.brand.gold,
          Icon: Building2,
        };
      case 'alert':
        return {
          bg: `${theme.status.warning}22`,
          fg: theme.status.warning,
          Icon: AlertTriangle,
        };
      default:
        return {
          bg: `${theme.typography.caption}22`,
          fg: theme.typography.secondary,
          Icon: Info,
        };
    }
  };

  const renderRow = (item: AppNotification) => {
    const {bg, fg, Icon} = kindStyle(item.kind);
    return (
      <Pressable
        key={item.id}
        onPress={() => markRead(item.id)}
        style={[styles.row, item.unread && styles.rowUnread]}
      >
        <View style={[styles.iconWrap, {backgroundColor: bg}]}>
          <Icon size={20} color={fg} strokeWidth={2} />
        </View>
        <View style={styles.bodyCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {t(item.titleKey)}
            </Text>
            <Text style={styles.time}>{t(item.timeKey)}</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {t(item.bodyKey)}
          </Text>
        </View>
        {item.unread ? <View style={styles.unreadDot} /> : null}
        <ForwardChevron
          size={16}
          color={theme.typography.caption}
          style={styles.chevron}
        />
      </Pressable>
    );
  };

  return (
    <ScreenContainer
      navTitle={t('notifications')}
      contentContainerStyle={styles.rootPad}
      pullToRefresh={{
        onRefresh: async () => {
          await new Promise<void>(resolve => setTimeout(resolve, 350));
        },
      }}>
      <View style={styles.toolbar}>
        <View style={styles.filters}>
          {(['all', 'unread'] as Filter[]).map(key => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    active && styles.filterLabelActive,
                  ]}
                >
                  {key === 'all' ? t('notifFilterAll') : t('notifFilterUnread')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>{t('notifMarkAllRead')}</Text>
          </Pressable>
        ) : null}
      </View>

      {unreadCount > 0 ? (
        <View style={styles.unreadBanner}>
          <Bell size={14} color={theme.brand.gold} strokeWidth={2.2} />
          <Text style={styles.unreadCount}>
            {t('notifUnreadCount', {count: unreadCount})}
          </Text>
        </View>
      ) : null}

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <BellOff size={28} color={theme.brand.gold} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>{t('notifEmptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('notifEmptyBody')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {today.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>{t('notifGroupToday')}</Text>
              {today.map(renderRow)}
            </>
          ) : null}
          {earlier.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>{t('notifGroupEarlier')}</Text>
              {earlier.map(renderRow)}
            </>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
};

export default NotificationsScreen;
