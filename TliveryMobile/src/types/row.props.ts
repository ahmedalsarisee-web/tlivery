import {ReactNode} from 'react';
import {StyleProp, ViewProps, ViewStyle} from 'react-native';

export interface RowProps extends ViewProps {
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  flex?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
