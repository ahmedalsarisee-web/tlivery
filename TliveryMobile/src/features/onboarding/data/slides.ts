import {ImageSourcePropType} from 'react-native';
import brand from '@app/config/brand';

export type OnboardingSlide = {
  key: string;
  titleKey: string;
  bodyKey: string;
  imageLight: ImageSourcePropType;
  imageDark: ImageSourcePropType;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: 'routes',
    titleKey: 'onboarding1Title',
    bodyKey: 'onboarding1Body',
    imageLight: brand.images.onboardingRoutes,
    imageDark: brand.images.onboardingRoutesDark,
  },
  {
    key: 'carriers',
    titleKey: 'onboarding2Title',
    bodyKey: 'onboarding2Body',
    imageLight: brand.images.onboardingCarriers,
    imageDark: brand.images.onboardingCarriersDark,
  },
  {
    key: 'tracking',
    titleKey: 'onboarding3Title',
    bodyKey: 'onboarding3Body',
    imageLight: brand.images.onboardingTracking,
    imageDark: brand.images.onboardingTrackingDark,
  },
];
