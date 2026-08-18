import {StyleProp, TextInputProps, ViewStyle} from 'react-native';
import type {ReactNode} from 'react';

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}
