import {useMemo, FC} from 'react';
import {Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Bell, ChevronLeft, ChevronRight, Menu} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import {NavHeaderVariant} from '@app/types/screenContainer.props';
import {RootStackParamList} from '@app/types/navigation';
import BrandLogo from '@app/components/brand-logo';
import {useOptionalCustomDrawer} from '@app/navigation/components/custom-drawer-layout';
import HeaderGradientBg from './HeaderGradientBg';
import {homeHeaderStyles} from './styles';

interface HomeHeaderProps {
  initials?: string;
  variant?: NavHeaderVariant;
  title?: string;
  showBack?: boolean;
  /** Center brand logo (brand variant). Default true. */
  showLogo?: boolean;
  /** @deprecated Wave removed from nav headers. Ignored. */
  showWave?: boolean;
  onBellPress?: () => void;
  onProfilePress?: () => void;
  onBackPress?: () => void;
}

const HomeHeader: FC<HomeHeaderProps> = ({
  variant = 'brand',
  title,
  showBack,
  showLogo = true,
  onBellPress,
  onBackPress,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const drawer = useOptionalCustomDrawer();
  const styles = useMemo(
    () => homeHeaderStyles(theme, direction),
    [theme, direction],
  );
  const rtl = isRTL(direction);

  const isBrand = variant === 'brand';
  const canGoBack = navigation.canGoBack();
  const shouldShowBack = !isBrand && (showBack ?? canGoBack);
  const showMenu = Boolean(drawer) && !shouldShowBack;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleBell = () => {
    if (onBellPress) {
      onBellPress();
      return;
    }
    navigation.navigate('Notifications');
  };

  const handleMenu = () => {
    drawer?.openDrawer();
  };

  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.chrome}>
        <HeaderGradientBg />
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.navRow}>
            {shouldShowBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('back')}
                onPress={handleBack}
                style={[styles.sideSlot, styles.sideSlotStart]}
                hitSlop={12}>
                <BackIcon
                  size={26}
                  color={theme.base.white}
                  strokeWidth={2.25}
                />
              </Pressable>
            ) : showMenu ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('openMenu', {defaultValue: 'Menu'})}
                onPress={handleMenu}
                style={[styles.sideSlot, styles.sideSlotStart]}
                hitSlop={12}>
                <View style={styles.bellWrap}>
                  <Menu size={22} color={theme.base.white} strokeWidth={2.2} />
                </View>
              </Pressable>
            ) : (
              <View style={styles.sideSlot} />
            )}

            {isBrand ? (
              showLogo ? (
                <View style={styles.logoGroup}>
                  <BrandLogo tone="onDark" size="header" />
                </View>
              ) : (
                <View style={styles.logoGroup} />
              )
            ) : (
              <View style={styles.titleOverlay}>
                {title ? (
                  <Text style={styles.pageTitle}>{title}</Text>
                ) : null}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('notifications')}
              onPress={handleBell}
              style={[styles.sideSlot, styles.sideSlotEnd]}
              hitSlop={8}>
              <View style={styles.bellWrap}>
                <Bell size={22} color={theme.base.white} strokeWidth={1.75} />
                {isBrand ? <View style={styles.goldBadge} /> : null}
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default HomeHeader;
