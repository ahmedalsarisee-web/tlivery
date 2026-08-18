import {memo, useEffect, useMemo, useRef, FC} from 'react';
import {Animated, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {ToastProps} from '@app/types/toast.props';
import {
  getAccentColor,
  getToastIcon,
  TOAST_VISIBILITY_MS,
} from '@app/utils/toastUtils';
import {toastStyles} from './styles';

const Toast: FC<ToastProps> = ({
  text,
  type,
  isVisible = true,
  hide,
}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const translateY = useRef(new Animated.Value(-100)).current;
  const styles = useMemo(
    () => toastStyles(theme, direction),
    [direction, theme],
  );

  useEffect(() => {
    const animation = Animated.timing(translateY, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [text, translateY]);

  useEffect(() => {
    if (!isVisible || !hide) {
      return;
    }

    const timer = setTimeout(hide, TOAST_VISIBILITY_MS);
    return () => clearTimeout(timer);
  }, [hide, isVisible, text]);

  const accentColor = useMemo(
    () => getAccentColor(type, theme),
    [theme, type],
  );

  if (!isVisible) {
    return null;
  }

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea} edges={['top']}>
      <Animated.View
        style={[
          styles.toastContainer,
          {borderStartColor: accentColor, transform: [{translateY}]},
        ]}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{getToastIcon(type)}</Text>
        </View>
        <Text style={styles.toastText} numberOfLines={3} ellipsizeMode="tail">
          {text}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

export default memo(Toast);
