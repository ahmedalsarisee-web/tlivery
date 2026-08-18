import {ReactNode} from 'react';
import {StyleProp, ViewProps, ViewStyle} from 'react-native';

export interface ColumnProps extends ViewProps {
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  flex?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
