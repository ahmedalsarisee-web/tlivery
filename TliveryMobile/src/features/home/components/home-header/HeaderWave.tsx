import {FC} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from '@app/providers/ThemeContext';
import {getHeight} from '@app/utils/responsive-design';
import {
  HOME_HEADER_NAV_HEIGHT,
  HOME_HEADER_WAVE_HEIGHT,
} from './headerMetrics';

export {HOME_HEADER_WAVE_HEIGHT, HOME_HEADER_NAV_HEIGHT};

const NAVY_PATH =
  'M 0 0 H 500 V 72 C 380 62, 280 82, 190 95 C 130 101, 65 97, 0 76 Z';

const GOLD_PATH =
  'M 0 76 C 65 97, 130 101, 190 95 C 195 94.2, 198 94, 200 94 C 150 104, 65 104, 0 91 Z';

const HeaderWave: FC = () => {
  const {theme} = useTheme();
  const {width} = useWindowDimensions();
  const height = getHeight(HOME_HEADER_WAVE_HEIGHT);

  return (
    <View style={[styles.wrap, {width, height}]} pointerEvents="none">
      <Svg
        width={width}
        height={height}
        viewBox="0 58 500 50"
        preserveAspectRatio="none">
        <Path d={NAVY_PATH} fill={theme.brand.navy} />
        <Path d={GOLD_PATH} fill={theme.brand.gold} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: -1,
    backgroundColor: 'transparent',
  },
});

export default HeaderWave;
