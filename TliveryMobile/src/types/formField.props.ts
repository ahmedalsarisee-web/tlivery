import {ReactNode} from 'react';
import {StyleProp, ViewStyle} from 'react-native';

export interface FormFieldProps {
  children: ReactNode;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
}
