import {useMemo, useState, FC} from 'react';
import {Image, LayoutChangeEvent, Text, View} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import brand from '@app/config/brand';
import {BrandLogoProps} from '@app/types/brandLogo.props';
import {brandLogoStyles} from './styles';

const EN_LETTERS = brand.name.toUpperCase().split('');

const BrandLogo: FC<BrandLogoProps> = ({
  tone = 'onDark',
  size = 'header',
  style,
}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => brandLogoStyles(theme, direction, size, tone),
    [theme, direction, size, tone],
  );
  const [arWidth, setArWidth] = useState(0);

  const onArLayout = (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    if (w > 0 && w !== arWidth) {
      setArWidth(w);
    }
  };

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="image"
      accessibilityLabel={brand.name}
    >
      <View style={styles.wordmark}>
        <Text style={styles.nameAr} onLayout={onArLayout}>
          {brand.nameAr}
        </Text>
        <View
          style={[
            styles.nameEnRow,
            arWidth > 0 ? {width: arWidth} : styles.nameEnRowFallback,
          ]}
        >
          {EN_LETTERS.map((letter, i) => (
            <Text key={`${letter}-${i}`} style={styles.nameEnLetter}>
              {letter}
            </Text>
          ))}
        </View>
      </View>
      <Image
        source={brand.images.symbol}
        style={styles.symbol}
        resizeMode="contain"
      />
    </View>
  );
};

export default BrandLogo;
