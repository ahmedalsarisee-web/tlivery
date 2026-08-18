export interface ThemeColors {
  primary: string;
  secondary: string;

  brand: {
    navy: string;
    gold: string;
  };

  base: {
    black: string;
    white: string;
  };

  typography: {
    primary: string;
    secondary: string;
    caption: string;
    error: string;
    inverse: string;
  };

  button: {
    primaryBackground: string;
    primaryText: string;
    secondaryBackground: string;
    secondaryText: string;
    disabledBackground: string;
    disabledText: string;
  };

  backgrounds: {
    background: string;
    onBackground: string;
    surface: string;
    /** Subtle line stroke for tiled doodle wallpapers on page canvas. */
    doodle: string;
    /** Lighter stroke for navy / gold chrome (header, heroes, drawer hero). */
    doodleOnDark: string;
  };

  ui: {
    border: string;
    borderLight: string;
    shadow: string;
    card: string;
    backdrop: string;
  };

  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };

  navigation: {
    activeTint: string;
    inactiveTint: string;
    background: string;
  };

  gradient: {
    header: readonly string[];
    profile: readonly string[];
    skeleton: readonly string[];
  };
}

export interface AppTheme {
  light: ThemeColors;
  dark: ThemeColors;
}
