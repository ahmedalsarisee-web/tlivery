import {ReactNode} from 'react';
import {PressableProps, StyleProp, ViewStyle} from 'react-native';

export interface CardProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: PressableProps['onPress'];
}
