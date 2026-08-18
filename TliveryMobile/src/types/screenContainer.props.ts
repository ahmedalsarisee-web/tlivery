import {ReactElement, ReactNode} from 'react';
import {
  RefreshControlProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {Edge} from 'react-native-safe-area-context';

export type NavHeaderVariant = 'brand' | 'page';

export type ScreenPullToRefreshConfig = {
  onRefresh: () => Promise<unknown>;
  /** Android spinner offset under the custom header. */
  progressViewOffset?: number;
};

export interface ScreenContainerProps {
  children?: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  bottomInset?: boolean;
  keyboardAvoiding?: boolean;
  keyboardBottomOffset?: number;
  withNavHeader?: boolean;
  navVariant?: NavHeaderVariant;
  navTitle?: string;
  showBack?: boolean;
  /** Custom back handler (e.g. cancel flow). Defaults to navigation.goBack. */
  onBackPress?: () => void;
  /** Brand header: show Wasel logo in the center (default true). */
  navShowLogo?: boolean;
  /** @deprecated Wave removed from nav headers. Ignored. */
  navShowWave?: boolean;
  edges?: Edge[];
  /** Prefer this — ScreenContainer owns RefreshControl state timing. */
  pullToRefresh?: ScreenPullToRefreshConfig;
  /** Escape hatch if a screen already builds its own RefreshControl. */
  refreshControl?: ReactElement<RefreshControlProps>;
  /**
   * When true (e.g. FlatList AppRefreshControl active), suppress the logo
   * + skeleton overlay so only the native pull spinner shows.
   */
  refreshing?: boolean;
  /**
   * Explicit screen load (queries). Combined with focused API tracking
   * unless `trackApiLoading` is false. Use for first render only.
   */
  loading?: boolean;
  /** Show Wasel loader + skeleton while tracked APIs run (default true). */
  trackApiLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Delivery doodle wallpaper (WhatsApp-style). Default true. */
  showDoodle?: boolean;
}
