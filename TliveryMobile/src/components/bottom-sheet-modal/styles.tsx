import {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {BottomSheetHeaderSurface} from '@app/types/bottomSheetModal.props';
import {cairoFont} from '@app/theme/fonts';
import {moderateScale} from '@app/utils/responsive-design';
import {
  getFlexDirection,
  getTextAlign,
  isRTL,
} from '@app/utils/directionalStyles';

export function useBottomSheetModalStyles(
  detached = false,
  headerSurface: BottomSheetHeaderSurface = 'glass',
) {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = themeType === 'dark';

  return useMemo(() => {
    const baseGutter = 24;
    const hPadL = detached ? baseGutter : baseGutter + insets.left;
    const hPadR = detached ? baseGutter : baseGutter + insets.right;
    const sheetBg = isDark ? theme.backgrounds.surface : theme.base.white;

    return StyleSheet.create({
      gestureRoot: {
        flex: 1,
      },
      overlay: {
        flex: 1,
        backgroundColor: theme.ui.backdrop,
        justifyContent: 'flex-end',
      },
      overlayAnimated: {
        flex: 1,
        justifyContent: 'flex-end',
      },
      dismissArea: {
        flex: 1,
      },
      sheet: {
        backgroundColor: sheetBg,
        borderTopLeftRadius: detached ? 28 : 24,
        borderTopRightRadius: detached ? 28 : 24,
        borderBottomLeftRadius: detached ? 28 : 0,
        borderBottomRightRadius: detached ? 28 : 0,
        marginLeft: detached ? insets.left + 16 : 0,
        marginRight: detached ? insets.right + 16 : 0,
        paddingLeft: hPadL,
        paddingRight: hPadR,
        paddingTop: 8,
        overflow: 'hidden',
      },
      sheetDetached: {
        shadowColor: theme.ui.shadow,
        shadowOpacity: isDark ? 0.32 : 0.16,
        shadowRadius: 20,
        shadowOffset: {width: 0, height: 10},
        elevation: 14,
      },
      headerGlass: {
        marginLeft: -hPadL,
        marginRight: -hPadR,
        marginTop: -8,
        marginBottom: 14,
        paddingLeft: hPadL,
        paddingRight: hPadR,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor:
          headerSurface === 'sheet'
            ? sheetBg
            : isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0.22)',
        borderBottomWidth: headerSurface === 'sheet' ? StyleSheet.hairlineWidth : 0.5,
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.ui.border,
      },
      handle: {
        alignSelf: 'center',
        width: 46,
        height: 5,
        borderRadius: 999,
        backgroundColor: isDark
          ? 'rgba(255,255,255,0.24)'
          : 'rgba(15,23,42,0.16)',
        marginBottom: 10,
      },
      headerWrap: {
        marginBottom: 2,
        gap: 4,
        flex: 1,
      },
      headerRow: {
        flexDirection: getFlexDirection(direction),
        alignItems: 'center',
        gap: 8,
      },
      title: {
        color: theme.typography.primary,
        fontSize: moderateScale(18),
        textAlign: getTextAlign(direction),
        writingDirection: isRTL(direction) ? 'rtl' : 'ltr',
        ...cairoFont('bold'),
      },
      subtitle: {
        color: theme.typography.secondary,
        fontSize: moderateScale(13),
        textAlign: getTextAlign(direction),
        writingDirection: isRTL(direction) ? 'rtl' : 'ltr',
        ...cairoFont('regular'),
      },
      headerCloseBtn: {
        padding: 8,
        marginTop: -4,
        borderRadius: 999,
      },
    });
  }, [
    detached,
    direction,
    headerSurface,
    insets.left,
    insets.right,
    isDark,
    theme.backgrounds.surface,
    theme.base.white,
    theme.typography.primary,
    theme.typography.secondary,
    theme.ui.backdrop,
    theme.ui.border,
    theme.ui.shadow,
  ]);
}
