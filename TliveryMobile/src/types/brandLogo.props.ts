import {StyleProp, ViewStyle} from 'react-native';

export type BrandLogoTone = 'onDark' | 'onLight';
export type BrandLogoSize = 'header' | 'hero';

export interface BrandLogoProps {
  tone?: BrandLogoTone;
  size?: BrandLogoSize;
  style?: StyleProp<ViewStyle>;
}
