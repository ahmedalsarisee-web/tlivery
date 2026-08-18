import {TextProps} from 'react-native';

export type AppTextVariant =
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption'
  | 'value';

export type AppTextTone = 'primary' | 'secondary' | 'inverse' | 'error';

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  tone?: AppTextTone;
}

export const defaultAppTextTone: Record<AppTextVariant, AppTextTone> = {
  title: 'primary',
  subtitle: 'secondary',
  heading: 'primary',
  body: 'primary',
  label: 'primary',
  caption: 'secondary',
  value: 'primary',
};
