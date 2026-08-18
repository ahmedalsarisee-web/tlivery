export type NotificationKind =
  | 'order'
  | 'delivery'
  | 'carrier'
  | 'system'
  | 'alert';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  titleKey: string;
  bodyKey: string;
  timeKey: string;
  unread: boolean;
  group: 'today' | 'earlier';
};
