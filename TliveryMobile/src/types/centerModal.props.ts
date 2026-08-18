import {ReactNode} from 'react';
import {StyleProp, ViewStyle} from 'react-native';

export interface CenterModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  dismissOnBackdrop?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
}
